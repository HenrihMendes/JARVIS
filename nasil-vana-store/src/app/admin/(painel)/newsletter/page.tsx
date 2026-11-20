import type { Metadata } from "next";
import { Suspense } from "react";
import { desc, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminPage, Table } from "@/components/admin/server-ui";

export const metadata: Metadata = { title: "Newsletter" };

async function List() {
  await requireAdmin();
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(schema.newsletterSubscribers).where(isNull(schema.newsletterSubscribers.unsubscribedAt)).orderBy(desc(schema.newsletterSubscribers.consentAt)).limit(200),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.newsletterSubscribers).where(isNull(schema.newsletterSubscribers.unsubscribedAt)),
  ]);
  return (
    <>
      <p className="mb-4 text-sm">{n} inscrita(s) ativas. {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- download de arquivo (rota de API) */}
      <a href="/admin/newsletter/exportar" className="underline">Exportar CSV</a> (para importar na sua ferramenta de e-mail).</p>
      <Table head={["E-mail", "Origem", "Consentimento"]} empty={rows.length ? undefined : "Nenhuma inscrição ainda."}>
        {rows.map((r) => (
          <tr key={r.id}><td className="px-4 py-3">{r.email}</td><td className="px-4 py-3 text-stone">{r.source}</td><td className="px-4 py-3 text-stone">{r.consentAt.toLocaleString("pt-BR", { timeZone: "America/Cuiaba" })}</td></tr>
        ))}
      </Table>
    </>
  );
}

export default function NewsletterPage() {
  return (
    <AdminPage title="Newsletter" description="Inscrições feitas no site com consentimento registrado (texto, data e origem).">
      <Suspense fallback={<div className="skeleton h-64" />}><List /></Suspense>
    </AdminPage>
  );
}
