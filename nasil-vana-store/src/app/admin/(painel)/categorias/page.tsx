import type { Metadata } from "next";
import { Suspense } from "react";
import { asc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminPage, Card } from "@/components/admin/server-ui";
import { ActionForm, Check, F, Submit } from "@/components/admin/ui";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions/store";

export const metadata: Metadata = { title: "Categorias" };

type Cat = typeof schema.categories.$inferSelect;

function CategoryForm({ c }: { c?: Cat }) {
  return (
    <ActionForm action={saveCategoryAction} resetOnSuccess={!c} className="grid gap-5 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <F label="Nome" name="name" defaultValue={c?.name} required />
      <F label="Endereço (URL)" name="slug" defaultValue={c?.slug} hint={`/loja/${c?.slug ?? "nome-da-categoria"}`} />
      <F label="Descrição curta" name="description" as="textarea" rows={2} defaultValue={c?.description ?? ""} className="sm:col-span-2" />
      <F label="Título para o Google" name="seoTitle" defaultValue={c?.seoTitle ?? ""} maxLength={70} />
      <F label="Descrição para o Google" name="seoDescription" defaultValue={c?.seoDescription ?? ""} maxLength={170} />
      <F label="Ordem" name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} />
      <div className="flex items-end"><Check label="Visível na loja" name="active" defaultChecked={c?.active ?? true} /></div>
      <div className="sm:col-span-2"><Submit>{c ? "Salvar" : "Criar categoria"}</Submit></div>
    </ActionForm>
  );
}

async function List() {
  await requireAdmin();
  const cats = await db
    .select({ c: schema.categories, n: sql<number>`(select count(*)::int from ${schema.products} where ${schema.products.categoryId} = ${schema.categories.id})` })
    .from(schema.categories)
    .orderBy(asc(schema.categories.sortOrder));
  return (
    <div className="space-y-6">
      {cats.map(({ c, n }) => (
        <details key={c.id} className="bg-paper ring-1 ring-line">
          <summary className="flex cursor-pointer items-center justify-between p-5"><span className="font-medium">{c.name} <span className="text-sm text-stone">· {n} produto(s){c.active ? "" : " · oculta"}</span></span><span className="text-sm text-stone">Editar</span></summary>
          <div className="border-t border-line p-5">
            <CategoryForm c={c} />
            <ActionForm action={deleteCategoryAction} confirm={`Excluir a categoria ${c.name}?`} className="mt-6 border-t border-line pt-4">
              <input type="hidden" name="id" value={c.id} />
              <button className="text-sm text-danger hover:underline">Excluir categoria</button>
            </ActionForm>
          </div>
        </details>
      ))}
      <Card title="Nova categoria"><CategoryForm /></Card>
    </div>
  );
}

export default function CategoriasPage() {
  return (
    <AdminPage title="Categorias" description="Organizam o menu e as páginas da loja (ex.: Vestidos, Corsets).">
      <Suspense fallback={<div className="skeleton h-64" />}><List /></Suspense>
    </AdminPage>
  );
}
