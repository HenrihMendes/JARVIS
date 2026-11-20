import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getPage, pageVars } from "@/lib/pages";
import { getSettings } from "@/lib/settings";
import { renderMarkdown } from "@/lib/markdown";
import { formatBRL } from "@/lib/money";
import { Breadcrumbs } from "@/components/catalog/page-heading";

const RESERVED = /^[a-z0-9-]{2,60}$/;

export async function generateMetadata({ params }: PageProps<"/[pagina]">): Promise<Metadata> {
  const { pagina } = await params;
  const page = RESERVED.test(pagina) ? await getPage(pagina) : null;
  if (!page) return { title: "Página não encontrada", robots: { index: false } };
  return { title: page.title, description: page.seoDescription ?? undefined, alternates: { canonical: `/${page.slug}` } };
}

async function ShippingTable() {
  const methods = await db.select().from(schema.shippingMethods).where(eq(schema.shippingMethods.active, true)).orderBy(asc(schema.shippingMethods.sortOrder));
  if (!methods.length) return null;
  return (
    <div className="my-10">
      <h2 className="serif text-2xl">Formas de entrega disponíveis</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {methods.map((m) => (
          <li key={m.id} className="flex flex-wrap justify-between gap-2 py-4 text-sm">
            <span>
              <strong className="font-medium">{m.name}</strong>
              {m.description && <span className="block text-stone">{m.description}</span>}
              {m.eta && <span className="block text-stone">{m.eta}</span>}
            </span>
            <span className="tabular">
              {m.type === "pickup" || m.priceCents === 0 ? "Grátis" : formatBRL(m.priceCents)}
              {m.freeAboveCents != null && m.type !== "pickup" ? <span className="block text-stone">Grátis acima de {formatBRL(m.freeAboveCents)}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ pagina: string }> }) {
  const { pagina } = await params;
  if (!RESERVED.test(pagina)) notFound();
  const [page, settings] = await Promise.all([getPage(pagina), getSettings()]);
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-[1100px] px-[var(--gutter)] pb-10 pt-10 sm:pt-14">
      <Breadcrumbs items={[{ name: "Início", path: "/" }, { name: page.title, path: `/${page.slug}` }]} />
      <h1 className="display mt-8 text-[clamp(2.8rem,6.5vw,5.5rem)]">{page.title}</h1>
      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="prose-nv lg:col-span-8">
          {renderMarkdown(page.body, pageVars(settings))}
          {page.slug === "entrega-e-frete" && <ShippingTable />}
          <p className="mt-12 text-[0.75rem] text-stone">Última atualização: {page.updatedAt.toLocaleDateString("pt-BR")}</p>
        </div>
      </div>
    </article>
  );
}

export default function InstitutionalPage(props: PageProps<"/[pagina]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1100px] px-[var(--gutter)] pt-14"><div className="skeleton h-24 w-2/3" /><div className="skeleton mt-10 h-96" /></div>}>
      <Content params={props.params} />
    </Suspense>
  );
}
