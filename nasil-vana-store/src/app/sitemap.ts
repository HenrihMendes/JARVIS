import type { MetadataRoute } from "next";
import { allPublicProducts, getCategories } from "@/lib/catalog";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { absolute } from "@/lib/seo";
import { mediaSrc, largest } from "@/lib/media-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, pages] = await Promise.all([
    allPublicProducts(),
    getCategories(),
    db.select({ slug: schema.pages.slug, updatedAt: schema.pages.updatedAt }).from(schema.pages).where(eq(schema.pages.published, true)),
  ]);
  const now = new Date();
  return [
    { url: absolute("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absolute("/loja"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: absolute(`/loja/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products
      .filter((p) => p.status === "active" || p.status === "coming_soon")
      .map((p) => ({
        url: absolute(`/produto/${p.slug}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        images: p.images.slice(0, 4).map((i) => absolute(mediaSrc(i.media.key, largest(i.media, 1280), "webp"))),
      })),
    ...pages.map((p) => ({ url: absolute(`/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.3 })),
    { url: absolute("/perguntas-frequentes"), changeFrequency: "monthly", priority: 0.4 },
    { url: absolute("/contato"), changeFrequency: "monthly", priority: 0.4 },
  ];
}
