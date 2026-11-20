import type { Metadata } from "next";
import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminPage } from "@/components/admin/server-ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Novo produto" };

async function Form() {
  await requireAdmin();
  const categories = await db.select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories).orderBy(asc(schema.categories.sortOrder));
  return <ProductForm categories={categories} product={null} />;
}

export default function NovoProdutoPage() {
  return (
    <AdminPage title="Novo produto" back={{ href: "/admin/produtos", label: "Produtos" }} description="Depois de salvar, você poderá enviar fotos e cadastrar cores, tamanhos e estoque.">
      <Suspense fallback={<div className="skeleton h-96" />}>
        <Form />
      </Suspense>
    </AdminPage>
  );
}
