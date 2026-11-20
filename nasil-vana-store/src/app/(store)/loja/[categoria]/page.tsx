import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogView, parseFilters, type RawSearch } from "@/components/catalog/catalog-view";
import { PageHeading } from "@/components/catalog/page-heading";
import { CatalogSkeleton } from "@/components/catalog/skeleton";
import { getCategories } from "@/lib/catalog";

async function findCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/loja/[categoria]">): Promise<Metadata> {
  const { categoria } = await params;
  const cat = await findCategory(categoria);
  if (!cat) return { title: "Categoria não encontrada" };
  const filtered = Object.keys(await searchParams).length > 0;
  return {
    title: cat.seoTitle ? { absolute: cat.seoTitle } : `${cat.name} femininos`,
    description: cat.seoDescription || cat.description || undefined,
    alternates: { canonical: `/loja/${cat.slug}` },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: cat.seoTitle || cat.name, description: cat.seoDescription || undefined, url: `/loja/${cat.slug}` },
  };
}

async function Content({ params, searchParams }: { params: Promise<{ categoria: string }>; searchParams: Promise<RawSearch> }) {
  const [{ categoria }, sp] = await Promise.all([params, searchParams]);
  const cat = await findCategory(categoria);
  if (!cat) notFound();
  return (
    <>
      <PageHeading
        eyebrow="Categoria"
        title={cat.name}
        description={cat.description}
        crumbs={[{ name: "Início", path: "/" }, { name: "Loja", path: "/loja" }, { name: cat.name, path: `/loja/${cat.slug}` }]}
      />
      <CatalogView base={`/loja/${cat.slug}`} filters={parseFilters(sp, cat.slug)} />
    </>
  );
}

export default function CategoriaPage(props: PageProps<"/loja/[categoria]">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <Content params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
