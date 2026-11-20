import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ORDER_STATUS_LABEL, syncPaymentFromProvider, expireStaleOrders } from "@/lib/orders";
import { formatBRL } from "@/lib/money";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/request";
import { paymentsConfigured } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/br";
import { AutoRefresh } from "@/components/checkout/auto-refresh";
import { IconCheck, IconLock, IconWhatsapp } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false, follow: false } };

const STEPS = [
  { key: "received", label: "Pedido recebido" },
  { key: "paid", label: "Pagamento confirmado" },
  { key: "preparing", label: "Em preparação" },
  { key: "out", label: "Enviado / pronto para retirada" },
  { key: "delivered", label: "Entregue" },
] as const;

function stepIndex(status: string) {
  switch (status) {
    case "paid":
      return 1;
    case "preparing":
      return 2;
    case "shipped":
    case "ready_for_pickup":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
}

async function Content({ params, searchParams }: PageProps<"/pedido/[token]">) {
  await connection();
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  await expireStaleOrders(10);

  let [order] = await db.select().from(schema.orders).where(eq(schema.orders.publicToken, token)).limit(1);
  if (!order) notFound();

  // Retorno do Mercado Pago: o navegador só nos diz QUAL pagamento consultar.
  // O status é confirmado consultando a API do MP no servidor.
  const paymentId = typeof sp.payment_id === "string" ? sp.payment_id : typeof sp.collection_id === "string" ? sp.collection_id : null;
  if (paymentId && /^\d{1,20}$/.test(paymentId) && paymentsConfigured && ["pending_payment", "expired"].includes(order.status)) {
    const rl = await rateLimit(`return:${await clientIpHash()}`, 20, 300);
    if (rl.ok) {
      try {
        const r = await syncPaymentFromProvider(paymentId, "retorno do checkout");
        if (r.orderId === order.id) [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, order.id)).limit(1);
      } catch (e) {
        console.error("[pedido] falha ao conciliar retorno", e instanceof Error ? e.message : e);
      }
    }
  }

  const [items, settings] = await Promise.all([
    db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)).orderBy(asc(schema.orderItems.productName)),
    getSettings(),
  ]);
  const pending = order.status === "pending_payment";
  const canPay = pending && order.mpInitPoint && order.expiresAt > new Date();
  const failed = sp.retorno === "falhou" && pending;
  const idx = stepIndex(order.status);
  const closed = ["cancelled", "expired", "refunded"].includes(order.status);
  const wa = whatsappLink(settings.store.whatsapp, `Olá! Tenho uma dúvida sobre o pedido #${order.number}.`);

  return (
    <div className="mx-auto max-w-[1100px] px-[var(--gutter)] pb-20 pt-10 sm:pt-14">
      {pending && <AutoRefresh active />}
      <p className="eyebrow text-stone">Pedido #{order.number}</p>
      <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.75rem)]">
        {order.status === "paid" || idx > 0 ? (
          <>
            Obrigada, <em>{order.customerName.split(" ")[0]}.</em>
          </>
        ) : pending ? (
          <>
            Aguardando <em>pagamento</em>
          </>
        ) : (
          ORDER_STATUS_LABEL[order.status]
        )}
      </h1>

      <div className="mt-6 max-w-2xl text-stone" aria-live="polite">
        {order.status === "paid" && <p>Recebemos o seu pagamento. Você receberá as próximas atualizações por e-mail em {order.customerEmail.replace(/(.{2}).*(@.*)/, "$1•••$2")}.</p>}
        {pending && order.paymentStatus === "in_process" && <p>Seu pagamento está em análise pelo Mercado Pago. Assim que for aprovado, esta página é atualizada automaticamente.</p>}
        {pending && order.paymentStatus === "pending" && <p>Assim que o Mercado Pago confirmar o pagamento (Pix costuma levar segundos), esta página é atualizada automaticamente.</p>}
        {pending && ["none", "rejected", "cancelled"].includes(order.paymentStatus) && (
          <p>
            {failed || order.paymentStatus === "rejected"
              ? "O pagamento não foi aprovado. Você pode tentar novamente com outro meio de pagamento."
              : "Seu pedido foi criado e as peças estão reservadas. Conclua o pagamento para confirmar."}{" "}
            Reserva válida até {order.expiresAt.toLocaleString("pt-BR", { timeZone: "America/Cuiaba", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })} (horário de Cuiabá).
          </p>
        )}
        {order.status === "expired" && <p>O prazo de reserva terminou sem confirmação de pagamento e as peças voltaram ao estoque. Se você pagou, fale com a gente.</p>}
        {order.status === "needs_attention" && <p>Recebemos uma atualização de pagamento que precisa de conferência. Nossa equipe vai entrar em contato.</p>}
      </div>

      {canPay && (
        <a href={order.mpInitPoint!} className="btn btn-primary mt-8">
          <IconLock size={16} /> {failed ? "Tentar pagar novamente" : "Pagar agora"} · {formatBRL(order.totalCents)}
        </a>
      )}

      {!closed && order.status !== "needs_attention" && (
        <ol className="mt-14 grid gap-6 border-y border-line py-8 sm:grid-cols-5 sm:gap-3" aria-label="Andamento do pedido">
          {STEPS.map((s, i) => {
            const done = i < idx || (i === 0) || (i === idx && idx > 0);
            return (
              <li key={s.key} className="flex items-center gap-3 sm:flex-col sm:items-start">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs ${done ? "border-ink bg-ink text-paper" : "border-line text-stone"}`}>
                  {done ? <IconCheck size={14} /> : i + 1}
                </span>
                <span className={`text-sm ${done ? "" : "text-stone"}`}>
                  {s.key === "out" && order.status === "ready_for_pickup" ? "Pronto para retirada" : s.key === "out" && order.status === "shipped" ? "Enviado" : s.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {order.trackingCode && (
        <p className="mt-8 text-sm">
          Código de rastreio: <strong className="font-medium tabular">{order.trackingCode}</strong>
          {order.trackingUrl && /^https:\/\//.test(order.trackingUrl) && (
            <>
              {" "}
              ·{" "}
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline">
                Rastrear
              </a>
            </>
          )}
        </p>
      )}

      <div className="mt-14 grid gap-12 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="itens">
          <h2 id="itens" className="serif text-2xl">
            Itens
          </h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {items.map((i) => (
              <li key={i.id} className="flex gap-4 py-4">
                {i.mediaKey && <img src={i.mediaKey} alt="" width={72} height={96} className="h-24 w-[4.5rem] object-cover" loading="lazy" />}
                <div className="flex-1">
                  <p className="serif">{i.productName}</p>
                  {i.variantLabel && <p className="text-[0.8125rem] text-stone">{i.variantLabel}</p>}
                  <p className="text-[0.8125rem] text-stone">
                    {i.quantity} × {formatBRL(i.unitPriceCents)}
                  </p>
                </div>
                <p className="text-sm tabular">{formatBRL(i.unitPriceCents * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone">Subtotal</dt>
              <dd className="tabular">{formatBRL(order.subtotalCents)}</dd>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-ok">
                <dt>Desconto {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                <dd className="tabular">− {formatBRL(order.discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-stone">{order.shipping.name}</dt>
              <dd className="tabular">{order.shippingCents ? formatBRL(order.shippingCents) : "Grátis"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3">
              <dt className="eyebrow">Total</dt>
              <dd className="serif text-xl tabular">{formatBRL(order.totalCents)}</dd>
            </div>
          </dl>
        </section>
        <aside className="space-y-8 text-sm lg:col-span-5">
          <div>
            <h2 className="eyebrow text-stone">Entrega</h2>
            <p className="mt-3">{order.shipping.name}</p>
            {order.shipping.eta && <p className="text-stone">{order.shipping.eta}</p>}
            {order.address && (
              <p className="mt-2 text-stone">
                {order.address.street}, {order.address.number}
                {order.address.complement ? ` — ${order.address.complement}` : ""}
                <br />
                {order.address.district} · {order.address.city}/{order.address.state} · {order.address.cep}
              </p>
            )}
          </div>
          <div>
            <h2 className="eyebrow text-stone">Dúvidas?</h2>
            <p className="mt-3 text-stone">Guarde o link desta página para acompanhar o pedido.</p>
            {wa && (
              <a href={wa} target="_blank" rel="noopener" className="btn btn-outline mt-4">
                <IconWhatsapp size={18} /> Falar com a loja
              </a>
            )}
          </div>
          <Link href="/loja" className="link-u link-u-on eyebrow inline-block">
            Continuar comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default function PedidoPage(props: PageProps<"/pedido/[token]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1100px] px-[var(--gutter)] pt-14"><div className="skeleton h-64" /></div>}>
      <Content {...props} />
    </Suspense>
  );
}
