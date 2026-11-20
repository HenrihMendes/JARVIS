import type { AllSettings } from "./settings-schema";
import type { ProductDetail } from "./catalog";
import { mediaSrc, largest } from "./media-url";
import { onlyDigits } from "./br";

/**
 * Dados estruturados Schema.org. Regra: nunca declarar o que não é verdade —
 * sem avaliações, sem endereço não informado, disponibilidade calculada do estoque real.
 */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const absolute = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

export function organizationJsonLd(s: AllSettings) {
  const st = s.store;
  const sameAs = [st.instagram ? `https://instagram.com/${st.instagram.replace(/^@/, "")}` : null].filter(Boolean);
  const hasAddress = st.showAddress && st.addressStreet && st.addressCity;
  const base = {
    "@context": "https://schema.org",
    "@type": hasAddress ? "ClothingStore" : "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: st.name,
    ...(st.legalName ? { legalName: st.legalName } : {}),
    url: SITE_URL,
    logo: absolute("/icon-512.png"),
    image: absolute("/og-default.jpg"),
    ...(st.email ? { email: st.email } : {}),
    ...(st.phone || st.whatsapp ? { telephone: `+55${onlyDigits(st.phone || st.whatsapp).replace(/^55/, "")}` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(st.cnpj ? { taxID: st.cnpj } : {}),
  };
  if (!hasAddress) return { ...base, areaServed: { "@type": "City", name: `${st.addressCity}, ${st.addressState}` } };
  return {
    ...base,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${st.addressStreet}${st.addressNumber ? `, ${st.addressNumber}` : ""}${st.addressComplement ? ` - ${st.addressComplement}` : ""}`,
      addressLocality: st.addressCity,
      addressRegion: st.addressState,
      ...(st.addressCep ? { postalCode: st.addressCep } : {}),
      addressCountry: "BR",
    },
    ...(st.mapsUrl ? { hasMap: st.mapsUrl } : {}),
    priceRange: "$$",
  };
}

export function websiteJsonLd(s: AllSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: s.store.name,
    url: SITE_URL,
    inLanguage: "pt-BR",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/loja?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absolute(it.path) })),
  };
}

/** Product (variação única) ou ProductGroup (várias cores/tamanhos), com Offer por variação. */
export function productJsonLd(p: ProductDetail, s: AllSettings) {
  const url = absolute(`/produto/${p.slug}`);
  const images = p.gallery.slice(0, 6).map((m) => absolute(mediaSrc(m.key, largest(m, 1600), "webp")));
  const brand = { "@type": "Brand", name: p.brand || s.store.name };
  const sellable = p.status === "active" && p.priceCents != null;
  const offerFor = (priceCents: number, stock: number, sku: string, vUrl: string) => ({
    "@type": "Offer",
    url: vUrl,
    sku,
    priceCurrency: "BRL",
    price: (priceCents / 100).toFixed(2),
    availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": `${SITE_URL}/#organization` },
  });

  if (!sellable || p.variants.length <= 1) {
    const v = p.variants[0];
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      name: p.name,
      description: p.seoDescription || p.description,
      image: images,
      url,
      brand,
      ...(p.categoryName ? { category: p.categoryName } : {}),
      ...(v ? { sku: v.sku } : {}),
      ...(p.gtin ? { gtin: p.gtin } : {}),
      ...(v?.colorName ? { color: v.colorName } : {}),
      ...(v?.sizeLabel ? { size: v.sizeLabel } : {}),
      ...(sellable && v ? { offers: offerFor(v.priceCents, v.stock, v.sku, url) } : {}),
    };
  }

  const varies = [p.colorOptions.length > 1 ? "https://schema.org/color" : null, p.sizeOptions.length > 1 ? "https://schema.org/size" : null].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "@id": `${url}#product`,
    name: p.name,
    description: p.seoDescription || p.description,
    url,
    brand,
    productGroupID: p.id,
    ...(p.categoryName ? { category: p.categoryName } : {}),
    ...(varies.length ? { variesBy: varies } : {}),
    hasVariant: p.variants.map((v) => {
      const params = new URLSearchParams();
      if (v.colorName) params.set("cor", v.colorName);
      if (v.sizeLabel) params.set("tamanho", v.sizeLabel);
      const vUrl = `${url}?${params.toString()}`;
      const img = p.gallery.find((g) => g.colorId === v.colorId) ?? p.gallery[0];
      return {
        "@type": "Product",
        name: [p.name, v.colorName, v.sizeLabel].filter(Boolean).join(" — "),
        sku: v.sku,
        ...(img ? { image: absolute(mediaSrc(img.key, largest(img, 1600), "webp")) } : {}),
        ...(v.colorName ? { color: v.colorName } : {}),
        ...(v.sizeLabel ? { size: v.sizeLabel } : {}),
        offers: offerFor(v.priceCents, v.stock, v.sku, vUrl),
      };
    }),
  };
}
