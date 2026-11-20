"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin, audit } from "@/lib/auth/session";
import { parseBRLToCents } from "@/lib/money";
import { slugify } from "@/lib/text";
import { ImageValidationError, mediaFiles, processAndStoreImage } from "@/lib/images";
import { deletePrefix } from "@/lib/storage";
import type { ActionState } from "@/components/admin/ui";

const money = (label: string, required = false) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (!v) {
        if (required) ctx.addIssue({ code: "custom", message: `Informe ${label}.` });
        return null;
      }
      try {
        const c = parseBRLToCents(v);
        if (c <= 0) throw new Error();
        return c;
      } catch {
        ctx.addIssue({ code: "custom", message: `${label} inválido. Ex.: 199,90` });
        return null;
      }
    });

const productInput = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  slug: z.string().trim().max(80).optional().default(""),
  subtitle: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().max(5000).optional().default(""),
  composition: z.string().trim().max(500).optional().default(""),
  care: z.string().trim().max(1000).optional().default(""),
  fitNotes: z.string().trim().max(500).optional().default(""),
  status: z.enum(["draft", "active", "coming_soon", "archived"]),
  categoryId: z.string().uuid().or(z.literal("")).optional().default(""),
  price: money("o preço"),
  compareAt: money("o preço original"),
  imageNotice: z.string().trim().max(200).optional().default(""),
  internalNotes: z.string().trim().max(2000).optional().default(""),
  seoTitle: z.string().trim().max(70).optional().default(""),
  seoDescription: z.string().trim().max(170).optional().default(""),
  gtin: z.string().trim().regex(/^(\d{8}|\d{12,14})?$/, "GTIN deve ter 8, 12, 13 ou 14 dígitos.").optional().default(""),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
});

export async function saveProductAction(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "") || null;
  const parsed = productInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "Revise os campos destacados.", errors };
  }
  const p = parsed.data;
  const errors: Record<string, string> = {};
  if (p.status === "active" && !p.price) errors.price = "Produto ativo precisa de preço.";
  if (p.compareAt && p.price && p.compareAt <= p.price) errors.compareAt = "O preço original deve ser maior que o preço de venda.";

  let slug = slugify(p.slug || p.name);
  if (!slug) errors.slug = "Endereço inválido.";
  if (Object.keys(errors).length) return { ok: false, message: "Revise os campos destacados.", errors };

  // Endereço único
  const clash = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(id ? and(eq(schema.products.slug, slug), ne(schema.products.id, id)) : eq(schema.products.slug, slug));
  if (clash.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  if (id && p.status === "active") {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.productVariants)
      .where(and(eq(schema.productVariants.productId, id), eq(schema.productVariants.active, true)));
    if (n === 0) return { ok: false, message: "Para publicar, cadastre ao menos uma variação (cor/tamanho) com estoque.", errors: { status: "Cadastre variações antes de ativar." } };
  }

  const values = {
    name: p.name,
    slug,
    subtitle: p.subtitle || null,
    description: p.description,
    composition: p.composition || null,
    care: p.care || null,
    fitNotes: p.fitNotes || null,
    status: p.status,
    categoryId: p.categoryId || null,
    priceCents: p.price,
    compareAtCents: p.compareAt,
    featured: form.get("featured") === "on",
    isNew: form.get("isNew") === "on",
    imageNotice: p.imageNotice || null,
    internalNotes: p.internalNotes || null,
    seoTitle: p.seoTitle || null,
    seoDescription: p.seoDescription || null,
    gtin: p.gtin || null,
    sortOrder: p.sortOrder,
  };

  if (id) {
    const [prev] = await db.select({ status: schema.products.status, publishedAt: schema.products.publishedAt }).from(schema.products).where(eq(schema.products.id, id));
    if (!prev) return { ok: false, message: "Produto não encontrado." };
    await db
      .update(schema.products)
      .set({ ...values, publishedAt: p.status === "active" && !prev.publishedAt ? new Date() : prev.publishedAt })
      .where(eq(schema.products.id, id));
    await audit(admin, "produto_atualizado", "product", id, { status: p.status });
    refresh();
    return { ok: true, message: "Produto salvo." };
  }
  if (p.status === "active") values.status = "draft"; // novo produto começa em rascunho até ter variações
  const [created] = await db.insert(schema.products).values(values).returning({ id: schema.products.id });
  await audit(admin, "produto_criado", "product", created.id);
  redirect(`/admin/produtos/${created.id}?novo=1`);
}

/* -------------------------------- Variações -------------------------------- */

const variantRow = z.object({
  id: z.string().uuid().nullable().optional(),
  colorId: z.string().uuid().nullable(),
  sizeId: z.string().uuid().nullable(),
  sku: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9._-]+$/, "SKU: use letras, números, ponto, hífen ou _"),
  stock: z.number().int().min(0).max(100000),
  price: z.string().trim().max(20).optional().default(""),
  active: z.boolean(),
});

export async function saveVariantsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const productId = z.string().uuid().safeParse(form.get("productId"));
  if (!productId.success) return { ok: false, message: "Produto inválido." };
  let rows: z.infer<typeof variantRow>[];
  try {
    rows = z.array(variantRow).max(200).parse(JSON.parse(String(form.get("rows") ?? "[]")));
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : "Dados inválidos.";
    return { ok: false, message: `Revise as variações: ${msg}` };
  }
  const combos = new Set<string>();
  const skus = new Set<string>();
  for (const r of rows) {
    const k = `${r.colorId}|${r.sizeId}`;
    if (combos.has(k)) return { ok: false, message: "Há duas variações com a mesma cor e tamanho." };
    combos.add(k);
    if (skus.has(r.sku.toUpperCase())) return { ok: false, message: `SKU repetido: ${r.sku}` };
    skus.add(r.sku.toUpperCase());
  }
  const parsedRows = rows.map((r) => {
    let priceCents: number | null = null;
    if (r.price) priceCents = parseBRLToCents(r.price);
    return { ...r, priceCents };
  });

  try {
    await db.transaction(async (tx) => {
      const existing = await tx.select({ id: schema.productVariants.id }).from(schema.productVariants).where(eq(schema.productVariants.productId, productId.data));
      const keep = new Set(parsedRows.filter((r) => r.id).map((r) => r.id!));
      const remove = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
      if (remove.length) await tx.delete(schema.productVariants).where(inArray(schema.productVariants.id, remove));
      for (const r of parsedRows) {
        const v = { productId: productId.data, colorId: r.colorId, sizeId: r.sizeId, sku: r.sku.toUpperCase(), stock: r.stock, priceCents: r.priceCents, active: r.active };
        if (r.id && existing.some((e) => e.id === r.id)) await tx.update(schema.productVariants).set(v).where(eq(schema.productVariants.id, r.id));
        else await tx.insert(schema.productVariants).values(v);
      }
    });
  } catch (e) {
    const msg = e instanceof Error && /sku/i.test(e.message) ? "Este SKU já é usado em outro produto." : "Não foi possível salvar as variações.";
    return { ok: false, message: msg };
  }
  await audit(admin, "variacoes_atualizadas", "product", productId.data, { count: rows.length });
  refresh();
  return { ok: true, message: "Variações e estoque salvos." };
}

/* ---------------------------------- Fotos ---------------------------------- */

export async function uploadProductImageAction(form: FormData): Promise<{ ok: boolean; message?: string }> {
  const admin = await requireAdmin();
  const productId = z.string().uuid().safeParse(form.get("productId"));
  const file = form.get("file");
  if (!productId.success || !(file instanceof File)) return { ok: false, message: "Envio inválido." };
  const colorId = z.string().uuid().safeParse(form.get("colorId"));
  try {
    const img = await processAndStoreImage(Buffer.from(await file.arrayBuffer()));
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${schema.productImages.sortOrder}), -1)::int` })
      .from(schema.productImages)
      .where(eq(schema.productImages.productId, productId.data));
    const [{ name }] = await db.select({ name: schema.products.name }).from(schema.products).where(eq(schema.products.id, productId.data));
    const [m] = await db
      .insert(schema.media)
      .values({ ...img, alt: name, originalName: file.name.slice(0, 120) })
      .returning({ id: schema.media.id });
    await db.insert(schema.productImages).values({ productId: productId.data, mediaId: m.id, colorId: colorId.success ? colorId.data : null, sortOrder: max + 1 });
    await audit(admin, "foto_enviada", "product", productId.data);
    refresh();
    return { ok: true };
  } catch (e) {
    if (e instanceof ImageValidationError) return { ok: false, message: e.message };
    console.error("[upload]", e instanceof Error ? e.message : e);
    return { ok: false, message: "Falha ao processar a imagem." };
  }
}

export async function updateProductImageAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  const focalY = Math.max(0, Math.min(100, Number(form.get("focalY") ?? 30) || 30));
  const colorRaw = String(form.get("colorId") ?? "");
  const colorId = colorRaw && /^[0-9a-f-]{36}$/.test(colorRaw) ? colorRaw : null;
  const [pi] = await db.select().from(schema.productImages).where(eq(schema.productImages.id, id));
  if (!pi) return { ok: false, message: "Foto não encontrada." };
  await db.update(schema.productImages).set({ colorId }).where(eq(schema.productImages.id, id));
  await db.update(schema.media).set({ alt, focalY }).where(eq(schema.media.id, pi.mediaId));
  refresh();
  return { ok: true, message: "Foto atualizada." };
}

export async function moveProductImageAction(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const dir = form.get("dir") === "up" ? -1 : 1;
  const [img] = await db.select().from(schema.productImages).where(eq(schema.productImages.id, id));
  if (!img) return;
  const all = await db.select().from(schema.productImages).where(eq(schema.productImages.productId, img.productId)).orderBy(schema.productImages.sortOrder);
  const idx = all.findIndex((x) => x.id === id);
  const swap = all[idx + dir];
  if (!swap) return;
  const order = all.map((x) => x.id);
  [order[idx], order[idx + dir]] = [order[idx + dir], order[idx]];
  await db.transaction(async (tx) => {
    for (let i = 0; i < order.length; i++) await tx.update(schema.productImages).set({ sortOrder: i }).where(eq(schema.productImages.id, order[i]));
  });
  refresh();
}

export async function deleteProductImageAction(form: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const [pi] = await db.select().from(schema.productImages).where(eq(schema.productImages.id, id));
  if (!pi) return;
  await db.delete(schema.productImages).where(eq(schema.productImages.id, id));
  const stillUsed = await db.select({ id: schema.productImages.id }).from(schema.productImages).where(eq(schema.productImages.mediaId, pi.mediaId)).limit(1);
  const bannerUse = await db.select({ id: schema.banners.id }).from(schema.banners).where(sql`${schema.banners.mediaId} = ${pi.mediaId} OR ${schema.banners.secondaryMediaId} = ${pi.mediaId}`).limit(1);
  if (!stillUsed.length && !bannerUse.length) {
    const [m] = await db.delete(schema.media).where(eq(schema.media.id, pi.mediaId)).returning();
    if (m) await deletePrefix(m.key, mediaFiles(m.widths)).catch(() => undefined);
  }
  await audit(admin, "foto_removida", "product", pi.productId);
  refresh();
}

/* ------------------------------ Excluir produto ------------------------------ */

export async function deleteProductAction(form: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.orderItems).where(eq(schema.orderItems.productId, id));
  if (n > 0) {
    // Produto com vendas: arquiva para preservar o histórico
    await db.update(schema.products).set({ status: "archived" }).where(eq(schema.products.id, id));
    await audit(admin, "produto_arquivado", "product", id);
  } else {
    await db.delete(schema.products).where(eq(schema.products.id, id));
    await audit(admin, "produto_excluido", "product", id);
  }
  redirect("/admin/produtos");
}
