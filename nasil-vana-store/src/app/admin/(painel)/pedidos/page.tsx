import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, expireStaleOrders, type OrderStatus } from "@/lib/orders";
import { AdminPage, Badge, Table, statusTone } from "@/components/admin/server-ui";

export const metadata: Metadata = { title: "Pedidos" };

async function List({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  await expireStaleOrders(50);
  const sp = await searchParams;
  const status = typeof sp.status === "string" && sp.status in ORDER_STATUS_LABEL ? (sp.status as OrderStatus) : null;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const page = Math.max(1, Number(sp.pagina) || 1);
  const conds: SQL[] = [];
  if (status) conds.push(eq(schema.orders.status, status));
  if (q) {
    const n = Number(q.replace("#", ""));
    conds.push(or(ilike(schema.orders.customerName, `%${q}%`), ilike(schema.orders.customerEmail, `%${q}%`), ...(Number.isInteger(n) && n > 0 ? [eq(schema.orders.number, n)] : []))!);
  }
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(schema.orders).where(where).orderBy(desc(schema.orders.createdAt)).limit(30).offset((page - 1) * 30),
    db.select({ total: sql<number>`count(*)::int` }).from(schema.orders).where(where),
  ]);
  return (
    <>
      <form className="mb-5 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Nº do pedido, nome ou e-mail" className="input max-w-xs bg-paper px-3" />
        <select name="status" defaultValue={status ?? ""} className="input max-w-[14rem] bg-paper px-3">
          <option value="">Todos os status</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-outline !min-h-11">Filtrar</button>
        <a href={`/admin/pedidos/exportar${status ? `?status=${status}` : ""}`} className="btn btn-outline !min-h-11">Exportar CSV</a>
      </form>
      <Table head={["Pedido", "Cliente", "Status", "Pagamento", "Entrega", "Total", "Data"]} empty={rows.length ? undefined : "Nenhum pedido encontrado."}>
        {rows.map((o) => (
          <tr key={o.id} className="hover:bg-paper-2/50">
            <td className="px-4 py-3"><Link href={`/admin/pedidos/${o.id}`} className="font-medium tabular hover:underline">#{o.number}</Link></td>
            <td className="px-4 py-3">{o.customerName}<span className="block text-[0.75rem] text-stone">{o.customerEmail}</span></td>
            <td className="px-4 py-3"><Badge tone={statusTone(o.status)}>{ORDER_STATUS_LABEL[o.status]}</Badge></td>
            <td className="px-4 py-3 text-stone">{PAYMENT_STATUS_LABEL[o.paymentStatus]}</td>
            <td className="px-4 py-3 text-stone">{o.shipping.name}</td>
            <td className="px-4 py-3 tabular">{formatBRL(o.totalCents)}</td>
            <td className="px-4 py-3 text-stone tabular">{o.createdAt.toLocaleString("pt-BR", { timeZone: "America/Cuiaba", dateStyle: "short", timeStyle: "short" })}</td>
          </tr>
        ))}
      </Table>
      {total > page * 30 && (
        <Link href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), pagina: String(page + 1) })}`} className="btn btn-outline mt-6 !min-h-11">Próxima página</Link>
      )}
    </>
  );
}

export default function PedidosPage(props: PageProps<"/admin/pedidos">) {
  return (
    <AdminPage title="Pedidos" description="Pedidos só ficam “Pagos” quando o Mercado Pago confirma o pagamento ao sistema.">
      <Suspense fallback={<div className="skeleton h-96" />}>
        <List searchParams={props.searchParams} />
      </Suspense>
    </AdminPage>
  );
}
