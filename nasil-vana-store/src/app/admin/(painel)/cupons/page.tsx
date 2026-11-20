import type { Metadata } from "next";
import { Suspense } from "react";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { centsToInput, formatBRL } from "@/lib/money";
import { AdminPage, Badge, Card } from "@/components/admin/server-ui";
import { ActionForm, Check, F, Submit } from "@/components/admin/ui";
import { saveCouponAction } from "@/app/admin/actions/store";

export const metadata: Metadata = { title: "Cupons" };
type C = typeof schema.coupons.$inferSelect;
const d = (x: Date | null) => (x ? new Date(x.getTime() - 4 * 3600_000).toISOString().slice(0, 10) : "");

function CouponForm({ c }: { c?: C }) {
  return (
    <ActionForm action={saveCouponAction} resetOnSuccess={!c} className="grid gap-5 sm:grid-cols-3">
      <>
          {c && <input type="hidden" name="id" value={c.id} />}
          <F label="Código" name="code" defaultValue={c?.code} placeholder="BEMVINDA10" />
          <F label="Tipo" name="type" as="select" defaultValue={c?.type ?? "percent"}>
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
            <option value="free_shipping">Frete grátis</option>
          </F>
          <F label="Valor (% ou R$)" name="value" defaultValue={c ? (c.type === "fixed" ? centsToInput(c.value) : String(c.value)) : ""} hint="Ignorado para frete grátis." />
          <F label="Compra mínima (R$)" name="minSubtotal" defaultValue={c?.minSubtotalCents ? centsToInput(c.minSubtotalCents) : ""} />
          <F label="Início" name="startsAt" type="date" defaultValue={d(c?.startsAt ?? null)} />
          <F label="Fim" name="endsAt" type="date" defaultValue={d(c?.endsAt ?? null)} />
          <F label="Limite de usos (vazio = ilimitado)" name="maxUses" type="number" min={1} defaultValue={c?.maxUses ?? ""} />
          <F label="Descrição interna" name="description" defaultValue={c?.description ?? ""} className="sm:col-span-2" />
          <div className="flex items-center gap-6 sm:col-span-3"><Check label="Ativo" name="active" defaultChecked={c?.active ?? true} /><Submit>{c ? "Salvar" : "Criar cupom"}</Submit></div>
        </>
    </ActionForm>
  );
}

async function List() {
  await requireAdmin();
  const coupons = await db.select().from(schema.coupons).orderBy(desc(schema.coupons.createdAt));
  return (
    <div className="space-y-4">
      {coupons.map((c) => (
        <details key={c.id} className="bg-paper ring-1 ring-line">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5">
            <span className="font-medium tabular">{c.code}</span>
            <span className="flex items-center gap-3 text-sm text-stone">
              {c.type === "percent" ? `${c.value}%` : c.type === "fixed" ? formatBRL(c.value) : "Frete grátis"} · {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""} usos
              <Badge tone={c.active ? "ok" : "neutral"}>{c.active ? "Ativo" : "Inativo"}</Badge>
            </span>
          </summary>
          <div className="border-t border-line p-5"><CouponForm c={c} /></div>
        </details>
      ))}
      <Card title="Novo cupom"><CouponForm /></Card>
    </div>
  );
}

export default function CuponsPage() {
  return (
    <AdminPage title="Cupons" description="Descontos aplicados no carrinho. O limite de usos é respeitado mesmo com compras simultâneas.">
      <Suspense fallback={<div className="skeleton h-64" />}><List /></Suspense>
    </AdminPage>
  );
}
