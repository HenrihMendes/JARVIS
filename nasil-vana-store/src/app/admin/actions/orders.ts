"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin, audit } from "@/lib/auth/session";
import { ADMIN_TRANSITIONS, ORDER_STATUS_LABEL, addOrderEvent, releaseOrder, syncPaymentFromProvider, type OrderStatus } from "@/lib/orders";
import { refundPayment, MercadoPagoError } from "@/lib/mercadopago";
import { sendOrderEmails } from "@/lib/email";
import type { ActionState } from "@/components/admin/ui";

const uuid = z.string().uuid();

export async function updateOrderStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = uuid.parse(form.get("id"));
  const to = String(form.get("status")) as OrderStatus;
  const notify = form.get("notify") === "on";
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
  if (!o) return { ok: false, message: "Pedido não encontrado." };
  const allowed = ADMIN_TRANSITIONS[o.status] ?? [];
  if (!allowed.includes(to)) return { ok: false, message: `Não é possível mudar de "${ORDER_STATUS_LABEL[o.status]}" para "${ORDER_STATUS_LABEL[to] ?? to}".` };
  if (to === "paid" && o.status === "needs_attention" && !["approved", "authorized"].includes(o.paymentStatus)) {
    return { ok: false, message: "Só marque como pago se o Mercado Pago mostrar o pagamento aprovado." };
  }

  if (to === "cancelled") {
    if (["approved", "authorized"].includes(o.paymentStatus)) {
      return { ok: false, message: "Este pedido está pago. Faça o reembolso primeiro (botão Reembolsar) — o cancelamento acontece automaticamente." };
    }
    await db.transaction((tx) => releaseOrder(tx, id, "cancelled", "Cancelado pela loja.", admin.email));
  } else {
    await db.update(schema.orders).set({ status: to }).where(eq(schema.orders.id, id));
    await addOrderEvent(db, id, "status", `Status alterado para ${ORDER_STATUS_LABEL[to]}.`, admin.email);
  }
  await audit(admin, "pedido_status", "order", id, { from: o.status, to });
  if (notify && (to === "shipped" || to === "ready_for_pickup")) {
    await sendOrderEmails(id, to === "shipped" ? "shipped" : "ready").catch(() => undefined);
    await addOrderEvent(db, id, "email", "Cliente notificada por e-mail.", admin.email);
  }
  refresh();
  return { ok: true, message: "Status atualizado." };
}

export async function updateTrackingAction(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = uuid.parse(form.get("id"));
  const code = String(form.get("trackingCode") ?? "").trim().slice(0, 60);
  const url = String(form.get("trackingUrl") ?? "").trim().slice(0, 300);
  if (url && !/^https:\/\//.test(url)) return { ok: false, message: "O link de rastreio deve começar com https://" };
  await db.update(schema.orders).set({ trackingCode: code || null, trackingUrl: url || null }).where(eq(schema.orders.id, id));
  await addOrderEvent(db, id, "rastreio", code ? `Código de rastreio: ${code}` : "Rastreio removido.", admin.email);
  refresh();
  return { ok: true, message: "Rastreio salvo." };
}

export async function addOrderNoteAction(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = uuid.parse(form.get("id"));
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  if (!note) return { ok: false, message: "Escreva a anotação." };
  await addOrderEvent(db, id, "nota", note, admin.email);
  refresh();
  return { ok: true, message: "Anotação adicionada." };
}

/** Consulta o Mercado Pago agora (útil se um webhook atrasar). */
export async function syncOrderPaymentAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = uuid.parse(form.get("id"));
  const paymentId = String(form.get("paymentId") ?? "").trim();
  if (!/^\d{1,20}$/.test(paymentId)) return { ok: false, message: "Informe o número do pagamento (ID da operação no Mercado Pago)." };
  try {
    const r = await syncPaymentFromProvider(paymentId, "conferência manual");
    if (r.orderId !== id) return { ok: false, message: "Este pagamento pertence a outro pedido (ou não tem referência)." };
    refresh();
    return { ok: true, message: `Pagamento conferido: ${r.outcome}.` };
  } catch (e) {
    return { ok: false, message: e instanceof MercadoPagoError ? `Mercado Pago: ${e.message}` : "Falha ao consultar." };
  }
}

export async function refundOrderAction(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin({ role: "owner" });
  const id = uuid.parse(form.get("id"));
  const [pay] = await db
    .select()
    .from(schema.payments)
    .where(and(eq(schema.payments.orderId, id), eq(schema.payments.status, "approved")))
    .orderBy(desc(schema.payments.createdAt))
    .limit(1);
  if (!pay) return { ok: false, message: "Não há pagamento aprovado para reembolsar." };
  try {
    await refundPayment(pay.providerPaymentId);
    await addOrderEvent(db, id, "reembolso", `Reembolso total solicitado ao Mercado Pago (pagamento ${pay.providerPaymentId}).`, admin.email);
    await audit(admin, "reembolso", "order", id, { payment: pay.providerPaymentId });
    // A confirmação chega pelo webhook; também conferimos agora.
    await syncPaymentFromProvider(pay.providerPaymentId, "reembolso").catch(() => undefined);
    refresh();
    return { ok: true, message: "Reembolso solicitado. O status é atualizado quando o Mercado Pago confirmar." };
  } catch (e) {
    return { ok: false, message: e instanceof MercadoPagoError ? `Mercado Pago recusou: ${e.status}` : "Falha ao solicitar reembolso." };
  }
}
