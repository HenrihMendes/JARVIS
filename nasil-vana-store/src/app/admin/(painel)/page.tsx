import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { env, paymentsConfigured, webhookSecretConfigured } from "@/lib/env";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL, expireStaleOrders } from "@/lib/orders";
import { AdminPage, Card, Stat, Badge } from "@/components/admin/server-ui";

export const metadata: Metadata = { title: "Visão geral" };

const PAID = ["paid", "preparing", "ready_for_pickup", "shipped", "delivered"] as const;

async function revenueSince(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const [r] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.orders.totalCents}),0)::int`, n: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(and(inArray(schema.orders.status, [...PAID]), gte(schema.orders.paidAt, since)));
  return r;
}

async function Dashboard() {
  await requireAdmin();
  await expireStaleOrders(50);
  const settings = await getSettings();
  const [d1, d7, d30, toFulfill, attention, pending, recent, lowStock, activeShipping, drafts] = await Promise.all([
    revenueSince(1),
    revenueSince(7),
    revenueSince(30),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.orders).where(inArray(schema.orders.status, ["paid", "preparing", "ready_for_pickup"])),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.orders).where(eq(schema.orders.status, "needs_attention")),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.orders).where(eq(schema.orders.status, "pending_payment")),
    db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(8),
    db
      .select({ sku: schema.productVariants.sku, stock: schema.productVariants.stock, name: schema.products.name, id: schema.products.id })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(and(eq(schema.products.status, "active"), eq(schema.productVariants.active, true), lte(schema.productVariants.stock, settings.commerce.lowStockThreshold)))
      .orderBy(schema.productVariants.stock)
      .limit(10),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.shippingMethods).where(eq(schema.shippingMethods.active, true)),
    db.select({ id: schema.products.id, name: schema.products.name, status: schema.products.status }).from(schema.products).where(inArray(schema.products.status, ["draft", "coming_soon"])),
  ]);

  const s = settings.store;
  const checklist = [
    { ok: paymentsConfigured, label: "Credencial do Mercado Pago (MP_ACCESS_TOKEN)", href: "/admin/configuracoes#pagamentos" },
    { ok: webhookSecretConfigured, label: "Assinatura secreta do webhook (MP_WEBHOOK_SECRET)", href: "/admin/configuracoes#pagamentos" },
    { ok: env.SITE_URL.startsWith("https://"), label: "Site publicado com HTTPS (SITE_URL)", href: "/admin/configuracoes#pagamentos" },
    { ok: activeShipping[0].n > 0, label: "Pelo menos uma forma de entrega ativa", href: "/admin/frete" },
    { ok: Boolean(s.legalName && s.cnpj), label: "Razão social e CNPJ (exigidos no comércio eletrônico)", href: "/admin/configuracoes" },
    { ok: Boolean(s.email), label: "E-mail de atendimento", href: "/admin/configuracoes" },
    { ok: Boolean(s.whatsapp), label: "WhatsApp de atendimento", href: "/admin/configuracoes" },
    { ok: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM), label: "E-mails automáticos de pedido (RESEND_API_KEY)", href: "/admin/configuracoes#email" },
    { ok: settings.commerce.maxInstallments != null, label: "Parcelamento definido (opcional)", href: "/admin/configuracoes" },
  ];
  const pendingSetup = checklist.filter((c) => !c.ok).length;

  return (
    <AdminPage title={`Olá, ${(await requireAdmin()).name.split(" ")[0]}.`} description="Resumo da loja e próximos passos.">
      {attention[0].n > 0 && (
        <Link href="/admin/pedidos?status=needs_attention" className="mb-6 block border-l-2 border-danger bg-danger/5 p-4 text-sm">
          <strong className="font-medium text-danger">{attention[0].n} pedido(s) precisam de atenção</strong> — pagamento com divergência ou sem estoque. Clique para revisar.
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Vendas hoje" value={formatBRL(d1.total)} hint={`${d1.n} pedido(s) pago(s) em 24 h`} />
        <Stat label="Últimos 7 dias" value={formatBRL(d7.total)} hint={`${d7.n} pedido(s)`} />
        <Stat label="Últimos 30 dias" value={formatBRL(d30.total)} hint={`${d30.n} pedido(s)`} />
        <Stat label="Para separar" value={toFulfill[0].n} hint={`${pending[0].n} aguardando pagamento`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Últimos pedidos" className="lg:col-span-2" aside={<Link href="/admin/pedidos" className="text-sm underline">Ver todos</Link>}>
          {recent.length === 0 ? (
            <p className="text-sm text-stone">Nenhum pedido ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-4 py-3 text-sm hover:bg-paper-2/60">
                    <span className="min-w-0">
                      <span className="font-medium tabular">#{o.number}</span> · <span className="truncate">{o.customerName}</span>
                      <span className="block text-[0.75rem] text-stone">{o.createdAt.toLocaleString("pt-BR", { timeZone: "America/Cuiaba" })}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Badge tone={o.status === "needs_attention" ? "danger" : o.status === "pending_payment" ? "warn" : ["cancelled", "expired"].includes(o.status) ? "neutral" : "ok"}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                      <span className="tabular">{formatBRL(o.totalCents)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Configuração da loja ${pendingSetup ? `· ${pendingSetup} pendente(s)` : "· completa"}`}>
          <ul className="space-y-2.5 text-sm">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-start gap-3 hover:underline">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${c.ok ? "bg-ok" : "bg-warn"}`} aria-hidden="true" />
                  <span className={c.ok ? "text-stone line-through decoration-stone/40" : ""}>{c.label}</span>
                  <span className="sr-only">{c.ok ? "(feito)" : "(pendente)"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Estoque baixo" className="lg:col-span-2">
          {lowStock.length === 0 ? (
            <p className="text-sm text-stone">Nenhuma variação com estoque baixo.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {lowStock.map((v) => (
                <li key={v.sku} className="flex justify-between py-2.5">
                  <Link href={`/admin/produtos/${v.id}`} className="hover:underline">
                    {v.name} <span className="text-stone">· {v.sku}</span>
                  </Link>
                  <Badge tone={v.stock === 0 ? "danger" : "warn"}>{v.stock === 0 ? "Esgotado" : `${v.stock} un.`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Produtos não publicados">
          {drafts.length === 0 ? (
            <p className="text-sm text-stone">Todos os produtos estão publicados.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {drafts.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/produtos/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>{" "}
                  <Badge>{p.status === "draft" ? "Rascunho" : "Em breve"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<div className="p-10"><div className="skeleton h-40" /></div>}>
      <Dashboard />
    </Suspense>
  );
}
