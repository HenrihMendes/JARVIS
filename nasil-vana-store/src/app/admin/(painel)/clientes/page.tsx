import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { desc, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { formatBRL } from "@/lib/money";
import { AdminPage, Badge, Table } from "@/components/admin/server-ui";

export const metadata: Metadata = { title: "Clientes" };

async function List({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const rows = await db
    .select({
      c: schema.customers,
      orders: sql<number>`(select count(*)::int from ${schema.orders} o where o.customer_id = ${schema.customers.id} and o.status in ('paid','preparing','ready_for_pickup','shipped','delivered'))`,
      spent: sql<number>`(select coalesce(sum(o.total_cents),0)::int from ${schema.orders} o where o.customer_id = ${schema.customers.id} and o.status in ('paid','preparing','ready_for_pickup','shipped','delivered'))`,
    })
    .from(schema.customers)
    .where(q ? or(ilike(schema.customers.name, `%${q}%`), ilike(schema.customers.email, `%${q}%`)) : undefined)
    .orderBy(desc(schema.customers.createdAt))
    .limit(100);
  return (
    <>
      <form className="mb-5 flex gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Nome ou e-mail" className="input max-w-xs bg-paper px-3" />
        <button className="btn btn-outline !min-h-11">Buscar</button>
      </form>
      <Table head={["Cliente", "Pedidos pagos", "Total comprado", "Novidades por e-mail", "Desde"]} empty={rows.length ? undefined : "Nenhuma cliente ainda."}>
        {rows.map(({ c, orders, spent }) => (
          <tr key={c.id} className="hover:bg-paper-2/50">
            <td className="px-4 py-3"><Link href={`/admin/clientes/${c.id}`} className="font-medium hover:underline">{c.name}</Link><span className="block text-[0.75rem] text-stone">{c.email}</span></td>
            <td className="px-4 py-3 tabular">{orders}</td>
            <td className="px-4 py-3 tabular">{formatBRL(spent)}</td>
            <td className="px-4 py-3">{c.marketingConsent ? <Badge tone="ok">Autorizou</Badge> : <Badge>Não</Badge>}</td>
            <td className="px-4 py-3 text-stone">{c.createdAt.toLocaleDateString("pt-BR")}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

export default function ClientesPage(props: PageProps<"/admin/clientes">) {
  return (
    <AdminPage title="Clientes" description="Dados pessoais protegidos pela LGPD: use apenas para atender pedidos e, com autorização, enviar novidades.">
      <Suspense fallback={<div className="skeleton h-64" />}><List searchParams={props.searchParams} /></Suspense>
    </AdminPage>
  );
}
