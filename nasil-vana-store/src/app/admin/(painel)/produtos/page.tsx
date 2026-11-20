import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { formatBRL } from "@/lib/money";
import { mediaSrc } from "@/lib/media-url";
import { AdminPage, Badge, Table } from "@/components/admin/server-ui";

export const metadata: Metadata = { title: "Produtos" };

const STATUS: Record<string, { label: string; tone: "ok" | "warn" | "neutral" | "ink" }> = {
  active: { label: "Ativo", tone: "ok" },
  draft: { label: "Rascunho", tone: "warn" },
  coming_soon: { label: "Em breve", tone: "ink" },
  archived: { label: "Arquivado", tone: "neutral" },
};

async function List({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.toLowerCase().slice(0, 60) : "";
  const st = typeof sp.status === "string" ? sp.status : "";
  const rows = await db.query.products.findMany({
    orderBy: [asc(schema.products.sortOrder), asc(schema.products.name)],
    with: { category: true, variants: true, images: { orderBy: [asc(schema.productImages.sortOrder)], limit: 1, with: { media: true } } },
  });
  const filtered = rows.filter((p) => (!q || p.name.toLowerCase().includes(q) || p.variants.some((v) => v.sku.toLowerCase().includes(q))) && (!st || p.status === st));
  return (
    <>
      <form className="mb-5 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Buscar por nome ou SKU" className="input max-w-xs bg-paper px-3" />
        <select name="status" defaultValue={st} className="input max-w-[12rem] bg-paper px-3">
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button className="btn btn-outline !min-h-11">Filtrar</button>
      </form>
      <Table head={["", "Produto", "Status", "Preço", "Estoque", "Categoria"]} empty={filtered.length ? undefined : "Nenhum produto encontrado."}>
        {filtered.map((p) => {
          const stock = p.variants.filter((v) => v.active).reduce((n, v) => n + v.stock, 0);
          const img = p.images[0]?.media;
          return (
            <tr key={p.id} className="hover:bg-paper-2/50">
              <td className="w-16 px-4 py-3">
                {img ? <img src={mediaSrc(img.key, img.widths[0], "webp")} alt="" width={48} height={64} className="h-16 w-12 object-cover" /> : <div className="h-16 w-12 bg-paper-2" />}
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/produtos/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                {p.internalNotes && <p className="mt-0.5 max-w-sm truncate text-[0.75rem] text-warn">⚑ {p.internalNotes}</p>}
              </td>
              <td className="px-4 py-3"><Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge></td>
              <td className="px-4 py-3 tabular">{p.priceCents ? formatBRL(p.priceCents) : "—"}</td>
              <td className="px-4 py-3 tabular">{p.variants.length ? <Badge tone={stock === 0 ? "danger" : stock <= 2 ? "warn" : "neutral"}>{stock} un.</Badge> : <span className="text-stone">sem variações</span>}</td>
              <td className="px-4 py-3 text-stone">{p.category?.name ?? "—"}</td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

export default function ProdutosPage(props: PageProps<"/admin/produtos">) {
  return (
    <AdminPage title="Produtos" description="Cadastre peças, fotos, cores, tamanhos e estoque. Só produtos Ativos aparecem na loja." actions={<Link href="/admin/produtos/novo" className="btn btn-primary !min-h-11">Novo produto</Link>}>
      <Suspense fallback={<div className="skeleton h-96" />}>
        <List searchParams={props.searchParams} />
      </Suspense>
    </AdminPage>
  );
}
