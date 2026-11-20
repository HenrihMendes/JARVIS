import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView, parseFilters, type RawSearch } from "@/components/catalog/catalog-view";
import { PageHeading } from "@/components/catalog/page-heading";
import { CatalogSkeleton } from "@/components/catalog/skeleton";

export async function generateMetadata({ searchParams }: PageProps<"/loja">): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : null;
  const filtered = Object.keys(sp).length > 0;
  return {
    title: q ? `Busca: ${q}` : "Loja — roupas femininas",
    description: "Corsets, vestidos, conjuntos de alfaiataria, blusas e saias. Moda feminina da Nasil Vana Store, em Sinop, MT, com compra online.",
    alternates: { canonical: "/loja" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

async function Content({ searchParams }: { searchParams: Promise<RawSearch> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  return (
    <>
      <PageHeading
        eyebrow={filters.q ? "Resultado da busca" : "Toda a loja"}
        title={filters.q ? <>&ldquo;{filters.q}&rdquo;</> : <>A <em>coleção</em></>}
        description={filters.q ? null : "Peças femininas com elegância e personalidade — da alfaiataria aos corsets."}
        crumbs={[{ name: "Início", path: "/" }, { name: "Loja", path: "/loja" }]}
      />
      <CatalogView base="/loja" filters={filters} />
    </>
  );
}

export default function LojaPage(props: PageProps<"/loja">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <Content searchParams={props.searchParams} />
    </Suspense>
  );
}
