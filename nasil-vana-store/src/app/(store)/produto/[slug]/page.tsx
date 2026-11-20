import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getRelated } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getPage, pageVars } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { whatsappLink } from "@/lib/br";
import { productJsonLd, absolute } from "@/lib/seo";
import { largest, mediaSrc } from "@/lib/media-url";
import { truncate } from "@/lib/text";
import { ProductExperience } from "@/components/product/product-experience";
import { ProductCard } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/catalog/page-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { IconPlus } from "@/components/ui/icons";

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Produto não encontrado", robots: { index: false } };
  const img = p.gallery[0];
  const description = p.seoDescription || truncate(`${p.name}${p.subtitle ? ` — ${p.subtitle}` : ""}. ${p.description}`, 158);
  return {
    title: p.seoTitle ? { absolute: p.seoTitle } : p.name,
    description,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: {
      type: "website",
      title: p.name,
      description,
      url: `/produto/${p.slug}`,
      images: img ? [{ url: absolute(mediaSrc(img.key, largest(img, 1280), "webp")), width: img.width, height: img.height, alt: img.alt ?? p.name }] : undefined,
    },
    other: p.priceCents
      ? { "product:price:amount": (p.priceCents / 100).toFixed(2), "product:price:currency": "BRL" }
      : undefined,
  };
}

function Accordion({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-line" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[0.8125rem] font-medium uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden">
        {title}
        <IconPlus size={16} className="transition-transform duration-500 group-open:rotate-45" />
      </summary>
      <div className="pb-6 text-[0.9375rem] leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const [settings, guide, related] = await Promise.all([getSettings(), getPage("guia-de-medidas"), getRelated(product, 4)]);
  const vars = pageVars(settings);
  const wa = whatsappLink(settings.store.whatsapp);

  const crumbs = [
    { name: "Início", path: "/" },
    { name: "Loja", path: "/loja" },
    ...(product.categorySlug ? [{ name: product.categoryName!, path: `/loja/${product.categorySlug}` }] : []),
    { name: product.name, path: `/produto/${product.slug}` },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(product, settings)} />
      <div className="pt-0 lg:pt-8">
        <ProductExperience
          product={product}
          maxInstallments={settings.commerce.maxInstallments}
          installmentNote={settings.commerce.installmentNote}
          lowStockThreshold={settings.commerce.lowStockThreshold}
          showLowStock={settings.commerce.showLowStock}
          whatsapp={wa}
          sizeGuide={guide ? renderMarkdown(guide.body, vars) : null}
        >
          <div className="pt-6 lg:pt-0">
            <Breadcrumbs items={crumbs} />
          </div>
        </ProductExperience>
      </div>

      <div className="mx-auto mt-14 grid max-w-[1600px] px-[var(--gutter)] lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5 lg:col-start-8">
          <div className="border-t border-line">
            <Accordion title="Descrição" open>
              <p className="whitespace-pre-line">{product.description}</p>
            </Accordion>
            {(product.composition || product.care) && (
              <Accordion title="Composição e cuidados">
                {product.composition && (
                  <p>
                    <strong className="font-medium">Composição:</strong> {product.composition}
                  </p>
                )}
                {product.care && (
                  <p className="mt-2 whitespace-pre-line">
                    <strong className="font-medium">Cuidados:</strong> {product.care}
                  </p>
                )}
              </Accordion>
            )}
            <Accordion title="Entrega">
              <p>Formas de entrega, valores e prazos para o seu CEP aparecem no checkout, antes do pagamento. O prazo começa após a confirmação do pagamento.</p>
              <Link href="/entrega-e-frete" className="mt-3 inline-block underline underline-offset-4">
                Política de entrega
              </Link>
            </Accordion>
            <Accordion title="Trocas e devoluções">
              <p>
                Compras online podem ser canceladas em até 7 dias após o recebimento (direito de arrependimento). Trocas por tamanho em até {settings.commerce.exchangeDays} dias,
                conforme a nossa política.
              </p>
              <Link href="/trocas-e-devolucoes" className="mt-3 inline-block underline underline-offset-4">
                Política de trocas
              </Link>
            </Accordion>
            <Accordion title="Pagamento seguro">
              <p>Pague com Pix ou cartão de crédito no ambiente do Mercado Pago. A loja não recebe nem armazena os dados do seu cartão.</p>
            </Accordion>
          </div>
          {product.imageNotice && <p className="mt-5 text-[0.75rem] leading-relaxed text-stone">{product.imageNotice}</p>}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-[var(--gutter)] pt-28" aria-labelledby="rel-title">
          <div className="mb-10 flex items-end justify-between gap-6" data-reveal>
            <h2 id="rel-title" className="display text-[clamp(2.2rem,4.5vw,3.75rem)]">
              Combine <em>com</em>
            </h2>
            {product.categorySlug && (
              <Link href={`/loja/${product.categorySlug}`} className="link-u link-u-on eyebrow">
                Ver {product.categoryName}
              </Link>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-5 lg:grid-cols-4">
            {related.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} index={i} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1600px] gap-8 lg:grid-cols-12 lg:gap-14 lg:px-[var(--gutter)] lg:pt-8" aria-busy="true">
      <div className="skeleton aspect-[3/4] lg:col-span-7 lg:aspect-[4/5]" />
      <div className="space-y-4 px-[var(--gutter)] lg:col-span-5 lg:px-0">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-14 w-3/4" />
        <div className="skeleton h-6 w-28" />
        <div className="skeleton mt-10 h-12 w-full" />
      </div>
    </div>
  );
}

export default function ProdutoPage(props: PageProps<"/produto/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <Content params={props.params} />
    </Suspense>
  );
}
