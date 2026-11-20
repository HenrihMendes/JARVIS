import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { formatBRL } from "@/lib/money";
import { maskCPF } from "@/lib/br";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { AdminPage, Badge, Card, statusTone } from "@/components/admin/server-ui";
import { ActionForm, Submit } from "@/components/admin/ui";
import { anonymizeCustomerAction } from "@/app/admin/actions/store";

export const metadata: Metadata = { title: "Cliente" };

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const c = await db.query.customers.findFirst({ where: eq(schema.customers.id, id), with: { addresses: true } });
  if (!c) notFound();
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.customerId, id)).orderBy(desc(schema.orders.createdAt));
  return (
    <AdminPage title={c.name} back={{ href: "/admin/clientes", label: "Clientes" }}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Dados">
          <p className="text-sm">{c.email}</p>
          <p className="text-sm">{c.phone ?? "—"}</p>
          <p className="text-sm text-stone">CPF: {admin.role === "owner" ? c.cpf ?? "—" : maskCPF(c.cpf)}</p>
          <p className="mt-3 text-sm">Novidades por e-mail: {c.marketingConsent ? `autorizado em ${c.marketingConsentAt?.toLocaleDateString("pt-BR")}` : "não autorizado"}</p>
          {c.anonymizedAt && <Badge tone="neutral">Anonimizada em {c.anonymizedAt.toLocaleDateString("pt-BR")}</Badge>}
        </Card>
        <Card title="Pedidos" className="lg:col-span-2">
          <ul className="divide-y divide-line text-sm">
            {orders.map((o) => (
              <li key={o.id} className="flex justify-between py-2.5">
                <Link href={`/admin/pedidos/${o.id}`} className="hover:underline">#{o.number} · {o.createdAt.toLocaleDateString("pt-BR")}</Link>
                <span className="flex gap-3"><Badge tone={statusTone(o.status)}>{ORDER_STATUS_LABEL[o.status]}</Badge>{formatBRL(o.totalCents)}</span>
              </li>
            ))}
          </ul>
        </Card>
        {admin.role === "owner" && (
          <Card title="LGPD — direitos da titular" className="lg:col-span-3">
            <div className="flex flex-wrap gap-4">
              <a href={`/admin/clientes/${c.id}/exportar`} className="btn btn-outline !min-h-11">Exportar dados (JSON)</a>
              {!c.anonymizedAt && (
                <ActionForm action={anonymizeCustomerAction} confirm="Anonimizar o cadastro desta cliente? Não pode ser desfeito.">
                  <input type="hidden" name="id" value={c.id} />
                  <Submit variant="danger">Anonimizar cadastro</Submit>
                </ActionForm>
              )}
            </div>
            <p className="mt-3 text-[0.8125rem] text-stone">A exportação atende pedidos de acesso/portabilidade. A anonimização atende pedidos de eliminação; os pedidos são mantidos pelo prazo legal (obrigações fiscais).</p>
          </Card>
        )}
      </div>
    </AdminPage>
  );
}

export default function ClientePage(props: PageProps<"/admin/clientes/[id]">) {
  return <Suspense fallback={<div className="p-10"><div className="skeleton h-64" /></div>}><Detail params={props.params} /></Suspense>;
}
