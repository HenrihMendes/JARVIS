import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminPage, Card } from "@/components/admin/server-ui";
import { ActionForm, Check, F, Submit } from "@/components/admin/ui";
import { deleteFaqAction, saveFaqAction, savePageAction } from "@/app/admin/actions/store";

export const metadata: Metadata = { title: "Páginas e FAQ" };

const HELP = (
  <>
    Formatação: <code>## Título</code>, <code>- item</code>, <code>**negrito**</code>, <code>[texto](/link)</code>. Campos automáticos: <code>{"{{loja.nome}}"}</code>, <code>{"{{loja.razaoSocial}}"}</code>, <code>{"{{loja.cnpj}}"}</code>, <code>{"{{loja.endereco}}"}</code>, <code>{"{{loja.email}}"}</code>, <code>{"{{loja.whatsapp}}"}</code>, <code>{"{{comercio.prazoTroca}}"}</code>.
  </>
);

async function Lists() {
  await requireAdmin();
  const [pages, faqs] = await Promise.all([db.select().from(schema.pages).orderBy(asc(schema.pages.slug)), db.select().from(schema.faqs).orderBy(asc(schema.faqs.sortOrder))]);
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        {pages.map((p) => (
          <details key={p.slug} className="bg-paper ring-1 ring-line">
            <summary className="flex cursor-pointer items-center justify-between p-5">
              <span className="font-medium">{p.title}</span>
              <Link href={`/${p.slug}`} target="_blank" className="text-sm text-stone underline">/{p.slug} ↗</Link>
            </summary>
            <ActionForm action={savePageAction} className="space-y-5 border-t border-line p-5">
              <input type="hidden" name="slug" value={p.slug} />
              <F label="Título" name="title" defaultValue={p.title} />
              <F label="Conteúdo" name="body" as="textarea" rows={18} defaultValue={p.body} hint={HELP} className="font-mono text-sm" />
              <F label="Descrição para o Google" name="seoDescription" defaultValue={p.seoDescription ?? ""} maxLength={170} />
              <div className="flex items-center gap-6"><Check label="Publicada" name="published" defaultChecked={p.published} /><Submit>Salvar página</Submit></div>
            </ActionForm>
          </details>
        ))}
      </div>

      <Card title="Perguntas frequentes">
        <ul className="divide-y divide-line">
          {faqs.map((q) => (
            <li key={q.id} className="py-4">
              <ActionForm action={saveFaqAction} className="grid gap-4 sm:grid-cols-[1fr_5rem]">
                <input type="hidden" name="id" value={q.id} />
                <F label="Pergunta" name="question" defaultValue={q.question} />
                <F label="Ordem" name="sortOrder" type="number" defaultValue={q.sortOrder} />
                <F label="Resposta" name="answer" as="textarea" rows={3} defaultValue={q.answer} className="sm:col-span-2" />
                <div className="flex items-center gap-6"><Check label="Ativa" name="active" defaultChecked={q.active} /><Submit variant="outline">Salvar</Submit></div>
              </ActionForm>
              <ActionForm action={deleteFaqAction} confirm="Excluir esta pergunta?" className="mt-2"><input type="hidden" name="id" value={q.id} /><button className="text-sm text-danger hover:underline">Excluir</button></ActionForm>
            </li>
          ))}
        </ul>
        <ActionForm action={saveFaqAction} resetOnSuccess className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-[1fr_5rem]">
          <F label="Nova pergunta" name="question" />
          <F label="Ordem" name="sortOrder" type="number" defaultValue={faqs.length} />
          <F label="Resposta" name="answer" as="textarea" rows={3} className="sm:col-span-2" />
          <input type="hidden" name="active" value="on" />
          <Submit>Adicionar pergunta</Submit>
        </ActionForm>
      </Card>
    </div>
  );
}

export default function PaginasPage() {
  return (
    <AdminPage title="Páginas e FAQ" description="Textos institucionais e políticas. São modelos — revise com um(a) advogado(a) antes de publicar a loja.">
      <Suspense fallback={<div className="skeleton h-64" />}><Lists /></Suspense>
    </AdminPage>
  );
}
