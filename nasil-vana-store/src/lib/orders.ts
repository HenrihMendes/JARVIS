import "server-only";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema, type Tx } from "@/db";
import { randomToken } from "./crypto";
import { amountCents, getPayment, mapPaymentStatus, type MPPayment } from "./mercadopago";
import { sendOrderEmails } from "./email";

/**
 * Regras de pedido e pagamento. Princípios:
 * 1. O banco é a fonte da verdade de preços/estoque; o navegador nunca define valores.
 * 2. Estoque é RESERVADO na criação do pedido com UPDATE condicional (stock >= qty) dentro
 *    de transação — impossível vender mais do que existe, mesmo com compras simultâneas.
 * 3. Pedido só vira "pago" quando o backend consulta o pagamento na API do Mercado Pago e
 *    confere referência, moeda e valor. O retorno do navegador apenas dispara essa consulta.
 * 4. Toda transição é idempotente (webhooks repetidos não duplicam efeitos).
 */

export type OrderStatus = (typeof schema.orderStatus.enumValues)[number];
export type PaymentStatus = (typeof schema.paymentStatus.enumValues)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pagamento aprovado",
  preparing: "Em preparação",
  ready_for_pickup: "Pronto para retirada",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
  needs_attention: "Requer atenção",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  none: "Não iniciado",
  pending: "Pendente",
  in_process: "Em análise",
  approved: "Aprovado",
  authorized: "Autorizado",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  charged_back: "Contestado (chargeback)",
  in_mediation: "Em disputa",
};

/** Transições permitidas pela proprietária no painel. */
export const ADMIN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending_payment: ["cancelled"],
  paid: ["preparing", "ready_for_pickup", "shipped", "cancelled"],
  preparing: ["ready_for_pickup", "shipped", "cancelled"],
  ready_for_pickup: ["delivered", "cancelled"],
  shipped: ["delivered"],
  needs_attention: ["paid", "cancelled"],
};

export async function addOrderEvent(tx: Tx | typeof db, orderId: string, type: string, message: string, actor = "sistema") {
  await tx.insert(schema.orderEvents).values({ orderId, type, message, actor });
}

export const newPublicToken = () => randomToken(24);

/* ------------------------------ Reserva de estoque ------------------------------ */

export class OutOfStockError extends Error {
  constructor(public sku: string) {
    super(`Sem estoque suficiente para ${sku}`);
  }
}

/** Debita o estoque de cada item. Lança OutOfStockError se algum não tiver saldo. */
export async function reserveStock(tx: Tx, items: { variantId: string | null; quantity: number; sku: string }[]) {
  for (const it of items) {
    if (!it.variantId) throw new OutOfStockError(it.sku);
    const r = await tx
      .update(schema.productVariants)
      .set({ stock: sql`${schema.productVariants.stock} - ${it.quantity}` })
      .where(and(eq(schema.productVariants.id, it.variantId), sql`${schema.productVariants.stock} >= ${it.quantity}`, eq(schema.productVariants.active, true)))
      .returning({ id: schema.productVariants.id });
    if (r.length === 0) throw new OutOfStockError(it.sku);
  }
}

/** Devolve estoque e uso de cupom de um pedido (idempotente via flags). */
export async function releaseOrder(tx: Tx, orderId: string, newStatus: OrderStatus, reason: string, actor = "sistema") {
  const [o] = await tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).for("update");
  if (!o) return null;
  if (o.stockReserved) {
    const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
    for (const it of items) {
      if (!it.variantId) continue;
      await tx
        .update(schema.productVariants)
        .set({ stock: sql`${schema.productVariants.stock} + ${it.quantity}` })
        .where(eq(schema.productVariants.id, it.variantId));
    }
  }
  if (o.couponCounted && o.couponId) {
    await tx
      .update(schema.coupons)
      .set({ usedCount: sql`GREATEST(${schema.coupons.usedCount} - 1, 0)` })
      .where(eq(schema.coupons.id, o.couponId));
  }
  await tx
    .update(schema.orders)
    .set({ status: newStatus, stockReserved: false, couponCounted: false, cancelledAt: ["cancelled", "expired"].includes(newStatus) ? new Date() : o.cancelledAt })
    .where(eq(schema.orders.id, orderId));
  await addOrderEvent(tx, orderId, "status", `${ORDER_STATUS_LABEL[newStatus]}: ${reason}${o.stockReserved ? " Estoque devolvido." : ""}`, actor);
  return o;
}

/** Expira pedidos não pagos após o prazo de reserva. Seguro para rodar em paralelo. */
export async function expireStaleOrders(limit = 50) {
  const stale = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.status, "pending_payment"),
        lt(schema.orders.expiresAt, new Date()),
        // Pagamento em análise (cartão) mantém a reserva até a decisão do MP
        inArray(schema.orders.paymentStatus, ["none", "pending", "rejected", "cancelled"]),
      ),
    )
    .limit(limit);
  let n = 0;
  for (const { id } of stale) {
    await db.transaction(async (tx) => {
      const [o] = await tx.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, id)).for("update");
      if (o?.status !== "pending_payment") return;
      await releaseOrder(tx, id, "expired", "Pagamento não confirmado dentro do prazo de reserva.");
      n++;
    });
  }
  return n;
}

/* ---------------------------- Atualização de pagamento ---------------------------- */

export type ProcessResult = { orderId: string | null; outcome: string };

/**
 * Consulta o pagamento na API do Mercado Pago e aplica ao pedido.
 * Chamado pelo webhook e pela página de retorno — nunca confia em dados do navegador.
 */
export async function syncPaymentFromProvider(paymentId: string, source: string): Promise<ProcessResult> {
  const payment = await getPayment(paymentId);
  return applyPayment(payment, source);
}

export async function applyPayment(payment: MPPayment, source: string): Promise<ProcessResult> {
  const orderId = payment.external_reference ?? null;
  if (!orderId || !/^[0-9a-f-]{36}$/.test(orderId)) return { orderId: null, outcome: "sem-referencia" };

  const status = mapPaymentStatus(payment.status);
  const providerId = String(payment.id);
  const amount = amountCents(payment);
  const updatedAt = payment.date_last_updated ? new Date(payment.date_last_updated) : new Date();
  let sendPaidEmail = false;

  const outcome = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).for("update");
    if (!order) return "pedido-inexistente";

    // Registro do pagamento (idempotente por provider+id; ignora atualizações mais antigas)
    const [existing] = await tx
      .select()
      .from(schema.payments)
      .where(and(eq(schema.payments.provider, "mercadopago"), eq(schema.payments.providerPaymentId, providerId)))
      .for("update");
    if (existing?.providerUpdatedAt && existing.providerUpdatedAt > updatedAt) return "atualizacao-antiga";
    if (existing && existing.status === status && existing.providerUpdatedAt?.getTime() === updatedAt.getTime()) return "repetido";

    const values = {
      orderId,
      provider: "mercadopago",
      providerPaymentId: providerId,
      status,
      statusDetail: payment.status_detail ?? null,
      paymentTypeId: payment.payment_type_id ?? null,
      paymentMethodId: payment.payment_method_id ?? null,
      installments: payment.installments ?? null,
      amountCents: amount,
      refundedCents: payment.transaction_amount_refunded ? Math.round(payment.transaction_amount_refunded * 100) : 0,
      providerUpdatedAt: updatedAt,
    };
    if (existing) await tx.update(schema.payments).set(values).where(eq(schema.payments.id, existing.id));
    else await tx.insert(schema.payments).values(values);

    // Validações de integridade
    const amountOk = amount === order.totalCents;
    const currencyOk = !payment.currency_id || payment.currency_id === "BRL";

    if (status === "approved" || status === "authorized") {
      if (["paid", "preparing", "ready_for_pickup", "shipped", "delivered"].includes(order.status)) {
        await tx.update(schema.orders).set({ paymentStatus: status }).where(eq(schema.orders.id, orderId));
        return "ja-pago";
      }
      if (!amountOk || !currencyOk) {
        await tx.update(schema.orders).set({ status: "needs_attention", paymentStatus: status }).where(eq(schema.orders.id, orderId));
        await addOrderEvent(
          tx,
          orderId,
          "alerta",
          `Pagamento ${providerId} aprovado com valor ${amount / 100} ${payment.currency_id ?? ""} diferente do pedido (${order.totalCents / 100} BRL). Verifique antes de enviar.`,
        );
        return "valor-divergente";
      }
      // Pedido expirado/cancelado que recebeu pagamento: tenta reservar o estoque de novo
      if (!order.stockReserved) {
        const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
        try {
          await tx.transaction(async (sp) => reserveStock(sp, items));
          await tx.update(schema.orders).set({ stockReserved: true }).where(eq(schema.orders.id, orderId));
        } catch {
          await tx.update(schema.orders).set({ status: "needs_attention", paymentStatus: status, paidAt: new Date() }).where(eq(schema.orders.id, orderId));
          await addOrderEvent(tx, orderId, "alerta", `Pagamento ${providerId} aprovado após a reserva expirar e não há estoque. Entre em contato com a cliente e avalie o reembolso.`);
          return "pago-sem-estoque";
        }
      }
      await tx.update(schema.orders).set({ status: "paid", paymentStatus: status, paidAt: new Date() }).where(eq(schema.orders.id, orderId));
      await addOrderEvent(tx, orderId, "pagamento", `Pagamento ${providerId} aprovado (${payment.payment_type_id ?? "—"}) via ${source}.`);
      sendPaidEmail = !order.confirmationEmailSentAt;
      return "pago";
    }

    if (status === "refunded" || status === "charged_back") {
      if (order.status === "refunded") return "ja-reembolsado";
      const shipped = ["shipped", "delivered"].includes(order.status);
      if (shipped) {
        await tx.update(schema.orders).set({ status: "refunded", paymentStatus: status }).where(eq(schema.orders.id, orderId));
        await addOrderEvent(tx, orderId, "pagamento", `Pagamento ${providerId}: ${status === "refunded" ? "reembolsado" : "contestado"}. Peça já enviada — estoque não alterado.`);
      } else {
        await tx.update(schema.orders).set({ paymentStatus: status }).where(eq(schema.orders.id, orderId));
        await releaseOrder(tx, orderId, "refunded", `Pagamento ${providerId} ${status === "refunded" ? "reembolsado" : "contestado"}.`);
      }
      return "reembolsado";
    }

    // pending / in_process / rejected / cancelled / in_mediation
    if (order.status === "pending_payment" || order.status === "expired") {
      await tx.update(schema.orders).set({ paymentStatus: status }).where(eq(schema.orders.id, orderId));
      await addOrderEvent(tx, orderId, "pagamento", `Pagamento ${providerId}: ${PAYMENT_STATUS_LABEL[status]}${payment.status_detail ? ` (${payment.status_detail})` : ""}.`);
    } else if (status === "in_mediation") {
      await tx.update(schema.orders).set({ paymentStatus: status }).where(eq(schema.orders.id, orderId));
      await addOrderEvent(tx, orderId, "alerta", `Pagamento ${providerId} em disputa no Mercado Pago.`);
    }
    return `status-${status}`;
  });

  if (sendPaidEmail) {
    try {
      await sendOrderEmails(orderId, "paid");
      await db.update(schema.orders).set({ confirmationEmailSentAt: new Date() }).where(eq(schema.orders.id, orderId));
    } catch (e) {
      console.error("[email] falha ao enviar confirmação", orderId, e instanceof Error ? e.message : e);
    }
  }
  return { orderId, outcome };
}
