import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { env, isProd, webhookSecretConfigured } from "@/lib/env";
import { verifyWebhookSignature } from "@/lib/mercadopago";
import { syncPaymentFromProvider } from "@/lib/orders";
import { eq } from "drizzle-orm";

/**
 * Notificações do Mercado Pago (Webhooks).
 * 1. Valida a assinatura x-signature (HMAC) — sem assinatura válida, nada é processado.
 * 2. Registra o evento (auditoria + detecção de repetição pelo x-request-id).
 * 3. NÃO confia no corpo: busca o pagamento na API do MP e aplica ao pedido (idempotente).
 * 4. Responde 200 rapidamente; em erro responde 500 para o MP reenviar.
 */
export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    const text = await req.text();
    if (text.length > 20_000) return new NextResponse("payload too large", { status: 413 });
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  const topic = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body.type ?? null;
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? (body.data?.id != null ? String(body.data.id) : null);

  let signatureValid = false;
  if (webhookSecretConfigured) {
    const check = verifyWebhookSignature({
      xSignature,
      xRequestId,
      dataId: url.searchParams.get("data.id") ?? dataId,
      secret: env.MP_WEBHOOK_SECRET!,
      toleranceSeconds: env.MP_WEBHOOK_TOLERANCE_SECONDS,
    });
    signatureValid = check.ok;
    if (!check.ok) {
      await db.insert(schema.webhookEvents).values({ provider: "mercadopago", requestId: xRequestId?.slice(0, 100), topic, resourceId: dataId?.slice(0, 40), signatureValid: false, status: "rejeitado", error: check.reason });
      return new NextResponse("invalid signature", { status: 401 });
    }
  } else if (isProd) {
    console.error("[webhook] MP_WEBHOOK_SECRET não configurado — notificação recusada");
    return new NextResponse("webhook secret not configured", { status: 503 });
  }

  const [evt] = await db
    .insert(schema.webhookEvents)
    .values({ provider: "mercadopago", requestId: xRequestId?.slice(0, 100), topic, resourceId: dataId?.slice(0, 40), signatureValid })
    .returning({ id: schema.webhookEvents.id });

  if (topic !== "payment" || !dataId || !/^\d{1,20}$/.test(dataId)) {
    await db.update(schema.webhookEvents).set({ status: "ignorado", processedAt: new Date() }).where(eq(schema.webhookEvents.id, evt.id));
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const r = await syncPaymentFromProvider(dataId, "webhook");
    await db.update(schema.webhookEvents).set({ status: r.outcome, processedAt: new Date() }).where(eq(schema.webhookEvents.id, evt.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    await db.update(schema.webhookEvents).set({ status: "erro", error: msg.slice(0, 300) }).where(eq(schema.webhookEvents.id, evt.id));
    return new NextResponse("error", { status: 500 });
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405, headers: { allow: "POST" } });
}
