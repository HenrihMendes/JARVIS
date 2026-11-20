import type { Metadata } from "next";
import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { centsToInput, formatBRL } from "@/lib/money";
import { AdminPage, Badge, Card } from "@/components/admin/server-ui";
import { ActionForm, Check, F, Submit } from "@/components/admin/ui";
import { deleteShippingAction, saveShippingAction } from "@/app/admin/actions/store";

export const metadata: Metadata = { title: "Frete" };
type M = typeof schema.shippingMethods.$inferSelect;

function ShippingForm({ m }: { m?: M }) {
  return (
    <ActionForm action={saveShippingAction} resetOnSuccess={!m} className="grid gap-5 sm:grid-cols-2">
      <>
          {m && <input type="hidden" name="id" value={m.id} />}
          <F label="Nome exibido" name="name" defaultValue={m?.name} placeholder="Entrega em Sinop" />
          <F label="Tipo" name="type" as="select" defaultValue={m?.type ?? "local_delivery"}>
            <option value="pickup">Retirada na loja (grátis, sem endereço)</option>
            <option value="local_delivery">Entrega local (motoboy / própria)</option>
            <option value="shipping">Envio (Correios / transportadora — valor fixo)</option>
          </F>
          <F label="Valor (R$)" name="price" defaultValue={m ? centsToInput(m.priceCents) : ""} />
          <F label="Grátis a partir de (R$) — opcional" name="freeAbove" defaultValue={m?.freeAboveCents ? centsToInput(m.freeAboveCents) : ""} />
          <F label="Prazo exibido" name="eta" defaultValue={m?.eta ?? ""} placeholder="Ex.: 1 a 2 dias úteis após o pagamento" />
          <F label="Descrição" name="description" defaultValue={m?.description ?? ""} />
          <F label="Faixas de CEP atendidas" name="cepRanges" as="textarea" rows={2} defaultValue={m?.cepRanges ?? ""} className="sm:col-span-2" hint="Uma faixa por linha ou separadas por vírgula. Ex.: 78550000-78559999 (Sinop). Vazio = todos os CEPs." />
          <F label="Ordem" name="sortOrder" type="number" defaultValue={m?.sortOrder ?? 0} />
          <div className="space-y-3 self-end">
            <Check label="Ativa no checkout" name="active" defaultChecked={m?.active ?? false} />
            <Check label="Confirmo que o frete é grátis (quando o valor for R$ 0,00)" name="confirmFree" />
          </div>
          <div className="sm:col-span-2"><Submit>{m ? "Salvar" : "Adicionar forma de entrega"}</Submit></div>
        </>
    </ActionForm>
  );
}

async function List() {
  await requireAdmin();
  const methods = await db.select().from(schema.shippingMethods).orderBy(asc(schema.shippingMethods.sortOrder));
  return (
    <div className="space-y-4">
      {methods.map((m) => (
        <details key={m.id} className="bg-paper ring-1 ring-line" open={!m.active}>
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5">
            <span className="font-medium">{m.name}</span>
            <span className="flex items-center gap-3 text-sm text-stone">{m.type === "pickup" ? "Grátis" : formatBRL(m.priceCents)} <Badge tone={m.active ? "ok" : "warn"}>{m.active ? "Ativa" : "Inativa"}</Badge></span>
          </summary>
          <div className="border-t border-line p-5">
            <ShippingForm m={m} />
            <ActionForm action={deleteShippingAction} confirm="Remover esta forma de entrega?" className="mt-5 border-t border-line pt-4"><input type="hidden" name="id" value={m.id} /><button className="text-sm text-danger hover:underline">Remover</button></ActionForm>
          </div>
        </details>
      ))}
      <Card title="Nova forma de entrega"><ShippingForm /></Card>
    </div>
  );
}

export default function FretePage() {
  return (
    <AdminPage
      title="Frete e entrega"
      description="O checkout mostra apenas as formas ativas que atendem o CEP da cliente. Cálculo automático pelos Correios/Melhor Envio exige contrato e credenciais — veja a documentação (docs/FRETE.md)."
    >
      <Suspense fallback={<div className="skeleton h-64" />}><List /></Suspense>
    </AdminPage>
  );
}
