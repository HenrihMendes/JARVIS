import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { and, asc, eq, inArray, lte, or, gte, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import type { MediaLike } from "./media-url";

/* -------------------------------------------------------------------------- */
/*  Tipos de apresentação                                                      */
/* -------------------------------------------------------------------------- */

export type Swatch = { id: string; name: string; hex: string | null; swatch: string | null };

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  status: "active" | "coming_soon";
  priceCents: number | null;
  compareAtCents: number | null;
  isNew: boolean;
  featured: boolean;
  categorySlug: string | null;
  categoryName: string | null;
  images: MediaLike[];
  colors: Swatch[];
  sizes: string[];
  inStock: boolean;
  totalStock: number;
  createdAt: Date;
  sortOrder: number;
  searchText: string;
};

export type VariantData = {
  id: string;
  sku: string;
  colorId: string | null;
  sizeId: string | null;
  colorName: string | null;
  sizeLabel: string | null;
  stock: number;
  priceCents: number;
};

export type ProductDetail = ProductCardData & {
  description: string;
  composition: string | null;
  care: string | null;
  fitNotes: string | null;
  imageNotice: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  gtin: string | null;
  brand: string | null;
  categoryId: string | null;
  gallery: (MediaLike & { colorId: string | null })[];
  variants: VariantData[];
  sizeOptions: { id: string; label: string }[];
  colorOptions: Swatch[];
  updatedAt: Date;
};

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const toMedia = (m: typeof schema.media.$inferSelect): MediaLike => ({
  key: m.key,
  width: m.width,
  height: m.height,
  widths: m.widths,
  blurDataUrl: m.blurDataUrl,
  alt: m.alt,
  focalY: m.focalY,
});

/* -------------------------------------------------------------------------- */
/*  Consulta base: catálogo público (ativos + "em breve")                       */
/*  Para catálogos de boutique (até ~2 mil itens) carregar e filtrar em memória */
/*  por requisição é simples, rápido e evita SQL dinâmico.                     */
/* -------------------------------------------------------------------------- */

const loadCatalog = cache(async () => {
  await connection();
  const rows = await db.query.products.findMany({
    where: inArray(schema.products.status, ["active", "coming_soon"]),
    orderBy: [asc(schema.products.sortOrder), asc(schema.products.createdAt)],
    with: {
      category: true,
      images: { orderBy: [asc(schema.productImages.sortOrder)], with: { media: true, color: true } },
      variants: { with: { color: true, size: true } },
    },
  });

  return rows
    .filter((p) => !p.category || p.category.active)
    .map((p) => {
      const activeVariants = p.variants.filter((v) => v.active);
      const totalStock = activeVariants.reduce((n, v) => n + v.stock, 0);
      const colorMap = new Map<string, Swatch>();
      for (const v of activeVariants) if (v.color) colorMap.set(v.color.id, { id: v.color.id, name: v.color.name, hex: v.color.hex, swatch: v.color.swatch });
      const sizeSet = new Map<string, number>();
      for (const v of activeVariants) if (v.size) sizeSet.set(v.size.label, v.size.sortOrder);
      const sizes = [...sizeSet.entries()].sort((a, b) => a[1] - b[1]).map(([l]) => l);
      const card: ProductCardData = {
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        status: p.status as "active" | "coming_soon",
        priceCents: p.priceCents,
        compareAtCents: p.compareAtCents && p.priceCents && p.compareAtCents > p.priceCents ? p.compareAtCents : null,
        isNew: p.isNew,
        featured: p.featured,
        categorySlug: p.category?.slug ?? null,
        categoryName: p.category?.name ?? null,
        images: p.images.map((i) => toMedia(i.media)),
        colors: [...colorMap.values()],
        sizes,
        inStock: p.status === "active" && totalStock > 0,
        totalStock,
        createdAt: p.createdAt,
        sortOrder: p.sortOrder,
        searchText: strip(
          [p.name, p.subtitle, p.description, p.category?.name, ...[...colorMap.values()].map((c) => c.name)].filter(Boolean).join(" "),
        ),
      };
      return { card, raw: p };
    });
});

export const getCategories = cache(async () => {
  await connection();
  return db.query.categories.findMany({
    where: eq(schema.categories.active, true),
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
    with: { image: true },
  });
});

/* --------------------------------- Listagem -------------------------------- */

export type SortKey = "relevancia" | "novidades" | "menor-preco" | "maior-preco";
export type CatalogFilters = {
  category?: string;
  q?: string;
  colors?: string[];
  sizes?: string[];
  min?: number;
  max?: number;
  sort?: SortKey;
  page?: number;
  onlyAvailable?: boolean;
};

export const PAGE_SIZE = 24;

export async function listProducts(f: CatalogFilters) {
  const all = (await loadCatalog()).map((x) => x.card);
  let base = all;
  if (f.category) base = base.filter((p) => p.categorySlug === f.category);
  if (f.q) {
    const terms = strip(f.q).split(/\s+/).filter(Boolean).slice(0, 8);
    base = base.filter((p) => terms.every((t) => p.searchText.includes(t)));
  }

  // Facetas calculadas antes dos filtros de cor/tamanho/preço
  const facetColors = new Map<string, Swatch & { count: number }>();
  const facetSizes = new Map<string, number>();
  let priceMin = Infinity;
  let priceMax = 0;
  for (const p of base) {
    for (const c of p.colors) facetColors.set(c.name, { ...c, count: (facetColors.get(c.name)?.count ?? 0) + 1 });
    for (const s of p.sizes) facetSizes.set(s, (facetSizes.get(s) ?? 0) + 1);
    if (p.priceCents) {
      priceMin = Math.min(priceMin, p.priceCents);
      priceMax = Math.max(priceMax, p.priceCents);
    }
  }

  let items = base;
  if (f.colors?.length) items = items.filter((p) => p.colors.some((c) => f.colors!.includes(c.name)));
  if (f.sizes?.length) items = items.filter((p) => p.sizes.some((s) => f.sizes!.includes(s)));
  if (f.min != null) items = items.filter((p) => (p.priceCents ?? 0) >= f.min!);
  if (f.max != null) items = items.filter((p) => p.priceCents != null && p.priceCents <= f.max!);
  if (f.onlyAvailable) items = items.filter((p) => p.inStock);

  const byAvailability = (a: ProductCardData, b: ProductCardData) => Number(b.inStock) - Number(a.inStock);
  const sorted = [...items];
  switch (f.sort) {
    case "novidades":
      sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case "menor-preco":
      sorted.sort((a, b) => (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity));
      break;
    case "maior-preco":
      sorted.sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1));
      break;
    default:
      sorted.sort((a, b) => byAvailability(a, b) || Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder);
  }

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, f.page ?? 1), pages);
  return {
    items: sorted.slice(0, page * PAGE_SIZE), // "carregar mais" acumulativo: mantém itens anteriores
    total,
    page,
    pages,
    facets: {
      colors: [...facetColors.values()].sort((a, b) => b.count - a.count),
      sizes: [...facetSizes.entries()].map(([label, count]) => ({ label, count })),
      priceMin: Number.isFinite(priceMin) ? priceMin : 0,
      priceMax,
    },
  };
}

/* ----------------------------------- Home ---------------------------------- */

export async function getHomeData() {
  const [catalog, categories, banners] = await Promise.all([loadCatalog(), getCategories(), getActiveBanners()]);
  const cards = catalog.map((x) => x.card);
  const available = cards.filter((c) => c.status === "active");
  const res = (c: ProductCardData) => (c.images[0] ? c.images[0].width * c.images[0].height : 0);
  // O primeiro destaque ocupa um bloco grande: escolhemos o de foto com maior resolução.
  const featured = available
    .filter((c) => c.featured)
    .sort((a, b) => Number(b.inStock) - Number(a.inStock))
    .slice(0, 8);
  const bestIdx = featured.reduce((best, c, i) => (res(c) > res(featured[best]) ? i : best), 0);
  if (bestIdx > 0) featured.unshift(...featured.splice(bestIdx, 1));
  const fresh = available.filter((c) => c.isNew).slice(0, 8);
  const comingSoon = cards.filter((c) => c.status === "coming_soon").slice(0, 2);
  const categoryCards = categories
    .map((cat) => {
      const products = available.filter((p) => p.categorySlug === cat.slug);
      const all = products.flatMap((p) => p.images);
      const tallest = all.sort((a, b) => b.height / b.width - a.height / a.width || b.width - a.width)[0] ?? null;
      const cover = cat.image ? toMedia(cat.image) : tallest;
      return { slug: cat.slug, name: cat.name, description: cat.description, count: products.length, cover };
    })
    .filter((c) => c.count > 0);
  return { featured, fresh, comingSoon, categoryCards, banners };
}

export const getActiveBanners = cache(async () => {
  await connection();
  const now = new Date();
  const rows = await db.query.banners.findMany({
    where: and(
      eq(schema.banners.active, true),
      or(isNull(schema.banners.startsAt), lte(schema.banners.startsAt, now)),
      or(isNull(schema.banners.endsAt), gte(schema.banners.endsAt, now)),
    ),
    orderBy: [asc(schema.banners.sortOrder)],
    with: { media: true, secondaryMedia: true },
  });
  const map = (b: (typeof rows)[number]) => ({
    id: b.id,
    eyebrow: b.eyebrow,
    title: b.title,
    subtitle: b.subtitle,
    ctaLabel: b.ctaLabel,
    ctaHref: b.ctaHref,
    media: b.media ? toMedia(b.media) : null,
    secondary: b.secondaryMedia ? toMedia(b.secondaryMedia) : null,
  });
  return {
    hero: rows.filter((b) => b.placement === "hero").map(map)[0] ?? null,
    campaigns: rows.filter((b) => b.placement === "campaign").map(map),
  };
});

/* ---------------------------------- Produto -------------------------------- */

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const catalog = await loadCatalog();
  const hit = catalog.find((x) => x.card.slug === slug);
  if (!hit) return null;
  const p = hit.raw;
  const activeVariants = p.variants.filter((v) => v.active);
  const sizeMap = new Map<string, { id: string; label: string; order: number }>();
  for (const v of activeVariants) if (v.size) sizeMap.set(v.size.id, { id: v.size.id, label: v.size.label, order: v.size.sortOrder });
  return {
    ...hit.card,
    description: p.description,
    composition: p.composition,
    care: p.care,
    fitNotes: p.fitNotes,
    imageNotice: p.imageNotice,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    gtin: p.gtin,
    brand: p.brand,
    categoryId: p.categoryId,
    updatedAt: p.updatedAt,
    gallery: p.images.map((i) => ({ ...toMedia(i.media), colorId: i.colorId })),
    variants: activeVariants.map((v) => ({
      id: v.id,
      sku: v.sku,
      colorId: v.colorId,
      sizeId: v.sizeId,
      colorName: v.color?.name ?? null,
      sizeLabel: v.size?.label ?? null,
      stock: v.stock,
      priceCents: v.priceCents ?? p.priceCents ?? 0,
    })),
    sizeOptions: [...sizeMap.values()].sort((a, b) => a.order - b.order).map(({ id, label }) => ({ id, label })),
    colorOptions: hit.card.colors,
  };
}

export async function getRelated(product: Pick<ProductCardData, "id" | "categorySlug">, limit = 4) {
  const all = (await loadCatalog()).map((x) => x.card).filter((c) => c.id !== product.id && c.status === "active");
  const same = all.filter((c) => c.categorySlug === product.categorySlug);
  const others = all.filter((c) => c.categorySlug !== product.categorySlug);
  return [...same.sort((a, b) => Number(b.inStock) - Number(a.inStock)), ...others.filter((c) => c.inStock)].slice(0, limit);
}

/** Para sitemap e feed do Merchant Center */
export async function allPublicProducts() {
  return (await loadCatalog()).map((x) => x.raw);
}
