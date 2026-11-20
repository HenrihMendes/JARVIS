import type { Metadata } from "next";
import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminPage, Card } from "@/components/admin/server-ui";
import { ActionForm, F, Submit } from "@/components/admin/ui";
import { deleteColorAction, deleteSizeAction, saveColorAction, saveSizeAction } from "@/app/admin/actions/store";

export const metadata: Metadata = { title: "Cores e tamanhos" };

async function Lists() {
  await requireAdmin();
  const [colors, sizes] = await Promise.all([
    db.select().from(schema.colors).orderBy(asc(schema.colors.sortOrder)),
    db.select().from(schema.sizes).orderBy(asc(schema.sizes.sortOrder)),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Cores">
        <ul className="divide-y divide-line">
          {colors.map((c) => (
            <li key={c.id} className="flex flex-wrap items-end gap-3 py-3">
              <span className="mb-3 h-6 w-6 rounded-full ring-1 ring-black/15" style={{ background: c.swatch ?? c.hex ?? "#ccc" }} />
              <ActionForm action={saveColorAction} className="flex flex-1 flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={c.id} />
                <F label="Nome" name="name" defaultValue={c.name} className="min-w-32 flex-1" />
                <F label="Cor" name="hex" type="color" defaultValue={c.hex ?? "#cccccc"} className="w-16" />
                <input type="hidden" name="sortOrder" value={c.sortOrder} />
                <Submit variant="outline">Salvar</Submit>
              </ActionForm>
              <ActionForm action={deleteColorAction} confirm={`Excluir ${c.name}?`}><input type="hidden" name="id" value={c.id} /><button className="mb-3 text-sm text-danger hover:underline">Excluir</button></ActionForm>
            </li>
          ))}
        </ul>
        <ActionForm action={saveColorAction} resetOnSuccess className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-5">
          <F label="Nova cor" name="name" placeholder="Ex.: Verde oliva" className="flex-1" />
          <F label="Cor" name="hex" type="color" defaultValue="#cccccc" className="w-16" />
          <Submit>Adicionar</Submit>
        </ActionForm>
      </Card>
      <Card title="Tamanhos">
        <ul className="divide-y divide-line">
          {sizes.map((s) => (
            <li key={s.id} className="flex items-end gap-3 py-3">
              <ActionForm action={saveSizeAction} className="flex flex-1 items-end gap-3">
                <input type="hidden" name="id" value={s.id} />
                <F label="Tamanho" name="label" defaultValue={s.label} className="flex-1" />
                <F label="Ordem" name="sortOrder" type="number" defaultValue={s.sortOrder} className="w-20" />
                <Submit variant="outline">Salvar</Submit>
              </ActionForm>
              <ActionForm action={deleteSizeAction} confirm={`Excluir ${s.label}?`}><input type="hidden" name="id" value={s.id} /><button className="mb-3 text-sm text-danger hover:underline">Excluir</button></ActionForm>
            </li>
          ))}
        </ul>
        <ActionForm action={saveSizeAction} resetOnSuccess className="mt-5 flex items-end gap-3 border-t border-line pt-5">
          <F label="Novo tamanho" name="label" placeholder="Ex.: 38" className="flex-1" />
          <F label="Ordem" name="sortOrder" type="number" defaultValue={sizes.length} className="w-20" />
          <Submit>Adicionar</Submit>
        </ActionForm>
      </Card>
    </div>
  );
}

export default function AtributosPage() {
  return (
    <AdminPage title="Cores e tamanhos" description="Usados nas variações dos produtos e nos filtros da loja.">
      <Suspense fallback={<div className="skeleton h-64" />}><Lists /></Suspense>
    </AdminPage>
  );
}
