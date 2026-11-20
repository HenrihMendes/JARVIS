import { connection } from "next/server";
import { allPublicProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { absolute } from "@/lib/seo";
import { mediaSrc, largest } from "@/lib/media-url";

/**
 * Feed de produtos para o Google Merchant Center (RSS 2.0 + namespace g:).
 * Uma entrada por variação (cor/tamanho), agrupadas por item_group_id.
 * Disponibilidade e preço vêm do banco em tempo real.
 */
const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function GET() {
  await connection();
  const settings = await getSettings();
  if (!settings.seo.merchantFeedEnabled) return new Response("Feed desativado", { status: 404 });
  const products = (await allPublicProducts()).filter((p) => p.status === "active" && p.priceCents);
  const items: string[] = [];
  for (const p of products) {
    for (const v of p.variants.filter((v) => v.active)) {
      const imgs = p.images.filter((i) => !i.colorId || i.colorId === v.colorId);
      const main = (imgs[0] ?? p.images[0])?.media;
      if (!main) continue;
      const price = v.priceCents ?? p.priceCents!;
      const onSale = p.compareAtCents && p.compareAtCents > price;
      const params = new URLSearchParams();
      if (v.color) params.set("cor", v.color.name);
      if (v.size) params.set("tamanho", v.size.label);
      const link = absolute(`/produto/${p.slug}${params.size ? `?${params}` : ""}`);
      items.push(`<item>
<g:id>${x(v.sku)}</g:id>
<g:item_group_id>${x(p.id)}</g:item_group_id>
<g:title>${x([p.name, v.color?.name, v.size ? `Tam. ${v.size.label}` : null].filter(Boolean).join(" — "))}</g:title>
<g:description>${x(p.description || p.name)}</g:description>
<g:link>${x(link)}</g:link>
<g:image_link>${x(absolute(mediaSrc(main.key, largest(main, 1600), "webp")))}</g:image_link>
${imgs.slice(1, 6).map((i) => `<g:additional_image_link>${x(absolute(mediaSrc(i.media.key, largest(i.media, 1600), "webp")))}</g:additional_image_link>`).join("\n")}
<g:availability>${v.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
<g:price>${((onSale ? p.compareAtCents! : price) / 100).toFixed(2)} BRL</g:price>
${onSale ? `<g:sale_price>${(price / 100).toFixed(2)} BRL</g:sale_price>` : ""}
<g:condition>new</g:condition>
<g:brand>${x(p.brand || settings.store.name)}</g:brand>
${p.gtin ? `<g:gtin>${x(p.gtin)}</g:gtin>` : "<g:identifier_exists>no</g:identifier_exists>"}
<g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>
<g:gender>female</g:gender>
<g:age_group>adult</g:age_group>
${v.color ? `<g:color>${x(v.color.name)}</g:color>` : ""}
${v.size ? `<g:size>${x(v.size.label)}</g:size>` : ""}
</item>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>
<title>${x(settings.store.name)}</title><link>${x(absolute("/"))}</link><description>Produtos ${x(settings.store.name)}</description>
${items.join("\n")}
</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=900" } });
}
