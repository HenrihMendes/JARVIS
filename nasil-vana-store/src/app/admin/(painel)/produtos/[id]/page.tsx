import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { centsToInput } from "@/lib/money";
import { AdminPage, Card } from "@/components/admin/server-ui";
import { ImageManager, ProductForm, VariantEditor } from "@/components/admin/product-form";
import { deleteProductAction } from "@/app/admin/actions/products";

export const metadata: Metadata = { title: "Editar produto" };

async function Editor({ params, searchParams }: PageProps<"/admin/produtos/[id]">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, id),
    with: {
      images: { orderBy: [asc(schema.productImages.sortOrder)], with: { media: true } },
      variants: { orderBy: [asc(schema.productVariants.createdAt)] },
    },
  });
  if (!product) notFound();
  const [categories, colors, sizes] = await Promise.all([
    db.select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories).orderBy(asc(schema.categories.sortOrder)),
    db.select({ id: schema.colors.id, name: schema.colors.name }).from(schema.colors).orderBy(asc(schema.colors.sortOrder)),
    db.select({ id: schema.sizes.id, name: schema.sizes.label }).from(schema.sizes).orderBy(asc(schema.sizes.sortOrder)),
  ]);
  const baseSku = product.slug.split("-").map((w) => w[0]).join("").toUpperCase().slice(0, 6) || "NV";

  return (
    <AdminPage
      title={product.name}
      back={{ href: "/admin/produtos", label: "Produtos" }}
      description={
        <>
          {sp.novo ? "Produto criado. Agora envie as fotos e cadastre as variações. " : ""}
          {product.status === "active" && (
            <Link href={`/produto/${product.slug}`} target="_blank" className="underline">
              Ver na loja ↗
            </Link>
          )}
        </>
      }
    >
      {product.internalNotes && <p className="mb-6 border-l-2 border-warn bg-warn/5 p-4 text-sm">⚑ {product.internalNotes}</p>}
      <div className="space-y-8">
        <ProductForm product={product} categories={categories} />
        <Card title="Fotos">
          <ImageManager
            productId={product.id}
            colors={colors}
            images={product.images.map((i) => ({ id: i.id, key: i.media.key, widths: i.media.widths, alt: i.media.alt, focalY: i.media.focalY, colorId: i.colorId }))}
          />
        </Card>
        <Card title="Cores, tamanhos e estoque">
          <p className="mb-5 text-sm text-stone">
            Cada combinação de cor e tamanho é uma variação com estoque próprio. O estoque diminui automaticamente quando um pedido é criado e volta se o pagamento não for
            confirmado. Faltou uma cor ou tamanho? <Link href="/admin/atributos" className="underline">Cadastre aqui</Link>.
          </p>
          <VariantEditor
            productId={product.id}
            baseSku={`NV-${baseSku}`}
            colors={colors}
            sizes={sizes}
            initial={product.variants.map((v) => ({ id: v.id, colorId: v.colorId, sizeId: v.sizeId, sku: v.sku, stock: v.stock, price: centsToInput(v.priceCents), active: v.active }))}
          />
        </Card>
        <Card title="Zona de cuidado">
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <p className="text-sm text-stone">Produtos que já tiveram vendas são arquivados (o histórico dos pedidos é preservado). Os demais são excluídos definitivamente.</p>
            <button type="submit" className="btn btn-outline mt-4 !min-h-11 !border-danger !text-danger">
              Excluir / arquivar produto
            </button>
          </form>
        </Card>
      </div>
    </AdminPage>
  );
}

export default function EditarProdutoPage(props: PageProps<"/admin/produtos/[id]">) {
  return (
    <Suspense fallback={<div className="p-10"><div className="skeleton h-96" /></div>}>
      <Editor {...props} />
    </Suspense>
  );
}
