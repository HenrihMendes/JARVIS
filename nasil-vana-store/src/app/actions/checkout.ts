"use server";

import { z } from "zod";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { findCartId, loadCart, clearCart } from "@/lib/cart";
import { availableShipping, computeTotals, evaluateCoupon, type ShippingRule } from "@/lib/pricing";
import { isValidCEP, isValidCPF, isValidPhoneBR, onlyDigits, UF, formatCPF, formatPhoneBR, formatCEP } from "@/lib/br";
import { env, paymentsConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/request";
import { getSettings } from "@/lib/settings";
import { normalizeEmail } from "@/lib/text";
import { addOrderEvent, expireStaleOrders, newPublicToken, OutOfStockError, releaseOrder, reserveStock } from "@/lib/orders";
import { createPreference, MercadoPagoError } from "@/lib/mercadopago";
import { mediaSrc, largest } from "@/lib/media-url";

/* ---------------------------------- CEP ---------------------------------- */

export type CepResult = { ok: true; street: string; district: string; city: string; state: string } | { ok: false; message: string };

export async function lookupCepAction(cep: string): Promise<CepResult> {
  const d = onlyDigits(cep);
  if (!isValidCEP(d)) return { ok: false, message: "CEP inválido." };
  const rl = await rateLimit(`cep:${await clientIpHash()}`, 30, 600);
  if (!rl.ok) return { ok: false, message: "Muitas consultas. Preencha o endereço manualmente." };
  try {
    const res = await fetch(`${env.VIACEP_BASE}/${d}/json/`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as { erro?: boolean | string; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
    if (j.erro) return { ok: false, message: "CEP não encontrado. Confira ou preencha manualmente." };
    return { ok: true, street: j.logradouro ?? "", district: j.bairro ?? "", city: j.localidade ?? "", state: j.uf ?? "" };
  } catch {
    return { ok: false, message: "Não foi possível consultar o CEP agora. Preencha o endereço manualmente." };
  }
}

/* --------------------------------- Frete --------------------------------- */

async function shippingRules(): Promise<ShippingRule[]> {
  return db.select().from(schema.shippingMethods).orderBy(asc(schema.shippingMethods.sortOrder));
}

export type ShippingQuote = {
  options: { id: string; name: string; description: string | null; eta: string | null; type: string; priceCents: number; finalPriceCents: number }[];
  subtotalCents: number;
  discountCents: number;
  couponLabel: string | null;
  freeShippingCoupon: boolean;
};

export async function quoteShippingAction(cep: string | null): Promise<ShippingQuote> {
  const cart = await loadCart(await findCartId());
  const coupon = cart.coupon?.ok ? cart.coupon : null;
  const rules = await shippingRules();
  const d = cep ? onlyDigits(cep) : null;
  const options = availableShipping(rules, d && isValidCEP(d) ? d : null, cart.subtotalCents, coupon?.freeShipping ?? false).map((o) => ({
    id: o.id,
    name: o.name,
    description: o.description,
    eta: o.eta,
    type: o.type,
    priceCents: o.priceCents,
    finalPriceCents: o.finalPriceCents,
  }));
  return {
    options,
    subtotalCents: cart.subtotalCents,
    discountCents: coupon?.discountCents ?? 0,
    couponLabel: coupon ? `${cart.couponCode} · ${coupon.label}` : null,
    freeShippingCoupon: coupon?.freeShipping ?? false,
  };
}

/* ------------------------------ Finalização ------------------------------ */

export type CheckoutState =
  | { ok: false; message: string; errors?: Record<string, string>; notices?: string[] }
  | { ok: true; redirectUrl: string }
  | null;

const base = z.object({
  idempotencyKey: z.string().uuid(),
  email: z.string().trim().toLowerCase().max(160).email("Informe um e-mail válido."),
  name: z
    .string()
    .trim()
    .min(5, "Informe nome e sobrenome.")
    .max(120)
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome."),
  phone: z.string().trim().refine(isValidPhoneBR, "Informe um celular com DDD."),
  cpf: z.string().trim().optional().default(""),
  shippingMethodId: z.string().uuid("Escolha a forma de entrega."),
  cep: z.string().trim().optional().default(""),
  street: z.string().trim().max(160).optional().default(""),
  number: z.string().trim().max(20).optional().default(""),
  complement: z.string().trim().max(80).optional().default(""),
  district: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  state: z.string().trim().toUpperCase().optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
  marketing: z.string().optional(),
});

export async function placeOrderAction(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const raw = Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  const parsed = base.safeParse(raw);
  const errors: Record<string, string> = {};
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "Revise os campos destacados.", errors };
  }
  const f = parsed.data;
  const settings = await getSettings();

  if (settings.commerce.requireCpf && !isValidCPF(f.cpf)) errors.cpf = "Informe um CPF válido.";
  else if (f.cpf && !isValidCPF(f.cpf)) errors.cpf = "CPF inválido.";

  const rl = await rateLimit(`checkout:${await clientIpHash()}`, 12, 600);
  if (!rl.ok) return { ok: false, message: "Muitas tentativas de compra em pouco tempo. Aguarde alguns minutos." };

  if (!paymentsConfigured) {
    return { ok: false, message: "O pagamento online ainda está sendo configurado pela loja. Fale com a gente pelo WhatsApp para finalizar sua compra." };
  }

  // Duplo clique / reenvio: devolve o mesmo pedido
  const [dup] = await db.select().from(schema.orders).where(eq(schema.orders.idempotencyKey, f.idempotencyKey)).limit(1);
  if (dup) {
    if (dup.status === "pending_payment" && dup.mpInitPoint) return { ok: true, redirectUrl: dup.mpInitPoint };
    return { ok: true, redirectUrl: `/pedido/${dup.publicToken}` };
  }

  await expireStaleOrders(20);

  const cartId = await findCartId();
  const cart = await loadCart(cartId);
  if (!cartId || cart.lines.length === 0) return { ok: false, message: "Sua sacola está vazia." };
  if (cart.notices.length || cart.lines.some((l) => l.notice)) {
    return { ok: false, message: "Alguns itens da sua sacola mudaram. Confira antes de continuar.", notices: [...cart.notices, ...cart.lines.filter((l) => l.notice).map((l) => `${l.name}: ${l.notice}`)] };
  }

  const [method] = await db.select().from(schema.shippingMethods).where(eq(schema.shippingMethods.id, f.shippingMethodId)).limit(1);
  if (!method || !method.active) errors.shippingMethodId = "Forma de entrega indisponível.";
  const needsAddress = method?.type !== "pickup";
  const cepDigits = onlyDigits(f.cep);
  if (needsAddress) {
    if (!isValidCEP(cepDigits)) errors.cep = "Informe um CEP válido.";
    if (f.street.length < 3) errors.street = "Informe a rua.";
    if (!f.number) errors.number = "Informe o número (ou S/N).";
    if (f.district.length < 2) errors.district = "Informe o bairro.";
    if (f.city.length < 2) errors.city = "Informe a cidade.";
    if (!(UF as readonly string[]).includes(f.state)) errors.state = "UF inválida.";
  }
  if (Object.keys(errors).length) return { ok: false, message: "Revise os campos destacados.", errors };

  const couponRow = cart.couponCode ? (await db.select().from(schema.coupons).where(eq(schema.coupons.code, cart.couponCode)).limit(1))[0] : null;
  const coupon = couponRow ? evaluateCoupon(couponRow, cart.subtotalCents) : null;
  const shippingOpt = availableShipping([method!], needsAddress ? cepDigits : null, cart.subtotalCents, coupon?.ok ? coupon.freeShipping : false)[0];
  if (!shippingOpt) return { ok: false, message: "Não entregamos neste CEP com a forma escolhida.", errors: { shippingMethodId: "Indisponível para este CEP." } };

  const totals = computeTotals({
    subtotalCents: cart.subtotalCents,
    discountCents: coupon?.ok ? coupon.discountCents : 0,
    shippingCents: shippingOpt.finalPriceCents,
  });
  const expiresAt = new Date(Date.now() + settings.commerce.reservationMinutes * 60_000);
  const publicToken = newPublicToken();
  const email = normalizeEmail(f.email);
  const cpf = f.cpf ? formatCPF(f.cpf) : null;

  let orderId: string;
  let orderNumber: number;
  try {
    ({ orderId, orderNumber } = await db.transaction(async (tx) => {
      // Cliente (dados mínimos — LGPD)
      const [customer] = await tx
        .insert(schema.customers)
        .values({
          email,
          name: f.name,
          phone: formatPhoneBR(f.phone),
          cpf,
          marketingConsent: f.marketing === "on",
          marketingConsentAt: f.marketing === "on" ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: schema.customers.email,
          set: {
            name: f.name,
            phone: formatPhoneBR(f.phone),
            ...(cpf ? { cpf } : {}),
            ...(f.marketing === "on" ? { marketingConsent: true, marketingConsentAt: new Date() } : {}),
            anonymizedAt: null,
          },
        })
        .returning({ id: schema.customers.id });

      const address = needsAddress
        ? { cep: formatCEP(cepDigits), street: f.street, number: f.number, complement: f.complement || null, district: f.district, city: f.city, state: f.state }
        : null;
      if (address) await tx.insert(schema.addresses).values({ customerId: customer.id, ...address });

      // Cupom: trava a linha para respeitar limite de usos em compras simultâneas
      let couponCounted = false;
      if (couponRow && coupon?.ok) {
        const upd = await tx
          .update(schema.coupons)
          .set({ usedCount: sql`${schema.coupons.usedCount} + 1` })
          .where(and(eq(schema.coupons.id, couponRow.id), sql`(${schema.coupons.maxUses} IS NULL OR ${schema.coupons.usedCount} < ${schema.coupons.maxUses})`))
          .returning({ id: schema.coupons.id });
        if (!upd.length) throw new Error("COUPON_EXHAUSTED");
        couponCounted = true;
      }

      const [order] = await tx
        .insert(schema.orders)
        .values({
          publicToken,
          idempotencyKey: f.idempotencyKey,
          customerId: customer.id,
          customerName: f.name,
          customerEmail: email,
          customerPhone: formatPhoneBR(f.phone),
          customerCpf: cpf,
          address,
          shipping: { methodId: method!.id, name: method!.name, type: method!.type, eta: method!.eta, priceCents: shippingOpt.finalPriceCents },
          ...totals,
          couponCode: coupon?.ok ? cart.couponCode : null,
          couponId: coupon?.ok ? couponRow!.id : null,
          couponCounted,
          notes: f.notes || null,
          expiresAt,
          stockReserved: true,
        })
        .returning({ id: schema.orders.id, number: schema.orders.number });

      const items = cart.lines.map((l) => ({
        orderId: order.id,
        variantId: l.variantId,
        productId: l.productId,
        productName: l.name,
        variantLabel: l.variantLabel || null,
        sku: l.sku,
        unitPriceCents: l.unitPriceCents,
        quantity: l.quantity,
        mediaKey: l.image ? mediaSrc(l.image.key, largest(l.image, 640), "webp") : null,
      }));
      await tx.insert(schema.orderItems).values(items);
      await reserveStock(tx, items);
      await addOrderEvent(tx, order.id, "criado", `Pedido criado. Estoque reservado até ${expiresAt.toLocaleString("pt-BR", { timeZone: "America/Cuiaba" })}.`);
      return { orderId: order.id, orderNumber: order.number };
    }));
  } catch (e) {
    if (e instanceof OutOfStockError) return { ok: false, message: "Uma das peças acabou de esgotar. Atualizamos sua sacola.", notices: ["Confira sua sacola antes de continuar."] };
    if (e instanceof Error && e.message === "COUPON_EXHAUSTED") return { ok: false, message: "O cupom atingiu o limite de usos. Remova-o para continuar." };
    console.error("[checkout] falha ao criar pedido", e instanceof Error ? e.message : e);
    return { ok: false, message: "Não foi possível criar o pedido. Tente novamente." };
  }

  // Preferência de pagamento (fora da transação: chamada externa)
  try {
    const site = env.SITE_URL.replace(/\/$/, "");
    const pref = await createPreference({
      orderId,
      orderNumber,
      publicToken,
      items: cart.lines.map((l) => ({
        id: l.sku,
        title: `${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""}`,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        pictureUrl: l.image && site.startsWith("https") ? `${site}${mediaSrc(l.image.key, largest(l.image, 640), "webp")}` : undefined,
      })),
      shippingCents: totals.shippingCents,
      discountCents: totals.discountCents,
      totalCents: totals.totalCents,
      payer: { name: f.name, email, phone: f.phone, cpf, cep: needsAddress ? cepDigits : null, street: f.street || null, number: f.number || null },
      expiresAt,
      maxInstallments: settings.commerce.maxInstallments,
      acceptBoleto: settings.commerce.acceptBoleto,
      statementDescriptor: settings.commerce.statementDescriptor,
    });
    await db.update(schema.orders).set({ mpPreferenceId: pref.id, mpInitPoint: pref.init_point }).where(eq(schema.orders.id, orderId));
    await addOrderEvent(db, orderId, "pagamento", "Cliente direcionada ao Mercado Pago.");
    await clearCart(cartId);
    return { ok: true, redirectUrl: pref.init_point };
  } catch (e) {
    console.error("[checkout] falha ao criar preferência MP", e instanceof MercadoPagoError ? `${e.status} ${JSON.stringify(e.details)}` : e);
    await db.transaction((tx) => releaseOrder(tx, orderId, "cancelled", "Falha ao iniciar o pagamento no Mercado Pago."));
    return { ok: false, message: "Não conseguimos iniciar o pagamento agora. Nenhum valor foi cobrado — tente novamente em instantes." };
  }
}
