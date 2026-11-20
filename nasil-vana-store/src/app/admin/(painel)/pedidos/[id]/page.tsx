import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { formatBRL } from "@/lib/money";
import { maskCPF } from "@/lib/br";
import { ADMIN_TRANSITIONS, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/orders";
import { AdminPage, Badge, Card, statusTone } from "@/components/admin/server-ui";
import { ActionForm, Check, F, Submit } from "@/components/admin/ui";
import { addOrderNoteAction, refundOrderAction, syncOrderPaymentAction, updateOrderStatusAction, updateTrackingAction } from "@/app/admin/actions/orders";
import { PrintButton } from "@/components/admin/print-button";

export const metadata: Metadata = { title: "Pedido" };

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.id, id),
    with: { items: true, events: { orderBy: [desc(schema.orderEvents.createdAt)] }, payments: { orderBy: [asc(schema.payments.createdAt)] } },
  });
  if (!order) notFound();
  const transitions = ADMIN_TRANSITIONS[order.status] ?? [];
  const approved = order.payments.find((p) => p.status === "approved");

  return (
    <AdminPage
      title={`Pedido #${order.number}`}
      back={{ href: "/admin/pedidos", label: "Pedidos" }}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          <span>Pagamento: {PAYMENT_STATUS_LABEL[order.paymentStatus]}</span>
          <span>· {order.createdAt.toLocaleString("pt-BR", { timeZone: "America/Cuiaba" })}</span>
        </span>
      }
      actions={<PrintButton />}
    >
      {order.status === "needs_attention" && (
        <p className="mb-6 border-l-2 border-danger bg-danger/5 p-4 text-sm">Este pedido precisa de conferência. Veja o histórico abaixo para o motivo (valor divergente ou pagamento após a reserva expirar).</p>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Itens">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3 text-sm">
                  {i.mediaKey && <img src={i.mediaKey} alt="" className="h-16 w-12 object-cover" />}
                  <div className="flex-1">
                    <p className="font-medium">{i.productName}</p>
                    <p className="text-stone">{[i.variantLabel, `SKU ${i.sku}`].filter(Boolean).join(" · ")}</p>
                  </div>
                  <p className="tabular">{i.quantity} × {formatBRL(i.unitPriceCents)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular">{formatBRL(order.subtotalCents)}</dd></div>
              {order.discountCents > 0 && <div className="flex justify-between"><dt className="text-stone">Desconto ({order.couponCode})</dt><dd className="tabular">− {formatBRL(order.discountCents)}</dd></div>}
              <div className="flex justify-between"><dt className="text-stone">{order.shipping.name}</dt><dd className="tabular">{formatBRL(order.shippingCents)}</dd></div>
              <div className="flex justify-between font-medium"><dt>Total</dt><dd className="tabular">{formatBRL(order.totalCents)}</dd></div>
            </dl>
          </Card>

          <Card title="Histórico">
            <ol className="space-y-3 text-sm">
              {order.events.map((e) => (
                <li key={e.id} className="grid grid-cols-[9rem_1fr] gap-3">
                  <span className="text-stone tabular">{e.createdAt.toLocaleString("pt-BR", { timeZone: "America/Cuiaba", dateStyle: "short", timeStyle: "short" })}</span>
                  <span>
                    {e.message} <span className="text-[0.75rem] text-stone">— {e.actor}</span>
                  </span>
                </li>
              ))}
            </ol>
            <ActionForm action={addOrderNoteAction} resetOnSuccess className="mt-6 flex gap-3 print:hidden">
              <input type="hidden" name="id" value={order.id} />
              <input name="note" placeholder="Adicionar anotação interna" className="input flex-1" maxLength={1000} />
              <Submit variant="outline">Anotar</Submit>
            </ActionForm>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Cliente">
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm"><a href={`mailto:${order.customerEmail}`} className="underline">{order.customerEmail}</a></p>
            <p className="text-sm">{order.customerPhone}</p>
            <p className="text-sm text-stone">CPF: {admin.role === "owner" ? order.customerCpf ?? "—" : maskCPF(order.customerCpf)}</p>
            {order.notes && <p className="mt-3 border-t border-line pt-3 text-sm">Obs.: {order.notes}</p>}
          </Card>

          <Card title="Entrega">
            <p className="text-sm font-medium">{order.shipping.name}</p>
            {order.address ? (
              <p className="mt-1 text-sm">
                {order.address.street}, {order.address.number}{order.address.complement ? ` — ${order.address.complement}` : ""}<br />
                {order.address.district} · {order.address.city}/{order.address.state}<br />CEP {order.address.cep}
              </p>
            ) : (
              <p className="mt-1 text-sm text-stone">Retirada na loja.</p>
            )}
            <ActionForm action={updateTrackingAction} className="mt-5 space-y-4 print:hidden">
              <input type="hidden" name="id" value={order.id} />
              <F label="Código de rastreio" name="trackingCode" defaultValue={order.trackingCode ?? ""} />
              <F label="Link de rastreio (https://)" name="trackingUrl" defaultValue={order.trackingUrl ?? ""} />
              <Submit variant="outline">Salvar rastreio</Submit>
            </ActionForm>
          </Card>

          {transitions.length > 0 && (
            <Card title="Atualizar status" className="print:hidden">
              <ActionForm action={updateOrderStatusAction} className="space-y-4">
                <input type="hidden" name="id" value={order.id} />
                <F label="Novo status" name="status" as="select">
                  {transitions.map((t) => <option key={t} value={t}>{ORDER_STATUS_LABEL[t]}</option>)}
                </F>
                <Check label="Avisar a cliente por e-mail (enviado / pronto para retirada)" name="notify" defaultChecked />
                <Submit>Atualizar</Submit>
              </ActionForm>
            </Card>
          )}

          <Card title="Pagamentos (Mercado Pago)" className="print:hidden">
            {order.payments.length === 0 ? (
              <p className="text-sm text-stone">Nenhuma notificação de pagamento recebida ainda.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span>#{p.providerPaymentId} · {p.paymentTypeId ?? "—"}{p.installments && p.installments > 1 ? ` · ${p.installments}×` : ""}</span>
                    <Badge tone={p.status === "approved" ? "ok" : p.status === "rejected" ? "danger" : "warn"}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <ActionForm action={syncOrderPaymentAction} className="mt-5 space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <F label="Conferir pagamento pelo ID" name="paymentId" inputMode="numeric" defaultValue={order.payments.at(-1)?.providerPaymentId ?? ""} hint="Consulta o status atual direto no Mercado Pago." />
              <Submit variant="outline">Conferir agora</Submit>
            </ActionForm>
            {approved && admin.role === "owner" && order.status !== "refunded" && (
              <ActionForm action={refundOrderAction} confirm={`Reembolsar ${formatBRL(approved.amountCents)} para a cliente? Esta ação não pode ser desfeita.`} className="mt-5 border-t border-line pt-5">
                <input type="hidden" name="id" value={order.id} />
                <Submit variant="danger">Reembolsar {formatBRL(approved.amountCents)}</Submit>
              </ActionForm>
            )}
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}

export default function PedidoAdminPage(props: PageProps<"/admin/pedidos/[id]">) {
  return (
    <Suspense fallback={<div className="p-10"><div className="skeleton h-96" /></div>}>
      <Detail params={props.params} />
    </Suspense>
  );
}
