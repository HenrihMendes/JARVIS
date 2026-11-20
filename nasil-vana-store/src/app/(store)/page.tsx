import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getHomeData } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/br";
import { Picture } from "@/components/ui/picture";
import { ProductCard } from "@/components/product/product-card";
import { CategoryIndex } from "@/components/home/category-index";
import { Rail } from "@/components/home/rail";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Monogram } from "@/components/brand/logo";
import { IconArrow, IconLock, IconReturn, IconChat, IconPin, IconInstagram } from "@/components/ui/icons";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

// Metadados estáticos: entram já no HTML inicial (Google, WhatsApp e Instagram leem sem esperar o streaming).
export const metadata: Metadata = {
  title: { absolute: "Nasil Vana Store — Moda feminina em Sinop, MT" },
  description:
    "Moda feminina com elegância e personalidade: corsets, vestidos, conjuntos e alfaiataria. Loja em Sinop, MT, com compra online e pagamento seguro.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  );
}

function HomeSkeleton() {
  return (
    <div className="mx-auto grid min-h-[calc(100svh-var(--header-h))] max-w-[1600px] gap-10 px-[var(--gutter)] lg:grid-cols-12" aria-busy="true">
      <div className="hidden flex-col justify-center gap-5 lg:col-span-5 lg:flex">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-3/4" />
      </div>
      <div className="skeleton -mx-[var(--gutter)] h-[78svh] lg:col-span-7 lg:mx-0 lg:h-auto" />
    </div>
  );
}

/** Divide o título em palavras que "sobem" uma a uma. */
function RisingTitle({ text, base = 0 }: { text: string; base?: number }) {
  const words = text.split(/\s+/);
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="reveal-line mr-[0.22em] inline-block align-bottom last:mr-0">
          <span style={{ ["--d" as string]: base + i * 85 }}>{w}</span>
        </span>
      ))}
    </>
  );
}

function SectionHead({ index, eyebrow, title, href, cta }: { index: string; eyebrow: string; title: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="mb-10 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between" data-reveal>
      <div>
        <p className="eyebrow flex items-center gap-3 text-stone">
          <span className="tabular">{index}</span>
          <span className="h-px w-8 bg-suede" />
          {eyebrow}
        </p>
        <h2 className="display mt-4 text-[clamp(2.4rem,5vw,4.25rem)]">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="link-u link-u-on eyebrow self-start sm:self-end">
          {cta}
        </Link>
      )}
    </div>
  );
}

async function Home() {
  const [{ featured, fresh, comingSoon, categoryCards, banners }, settings, shipping] = await Promise.all([
    getHomeData(),
    getSettings(),
    db.select({ type: schema.shippingMethods.type }).from(schema.shippingMethods).where(eq(schema.shippingMethods.active, true)),
  ]);
  const s = settings.store;
  const hero = banners.hero;
  const [campaignA, campaignB] = banners.campaigns;
  const wa = whatsappLink(s.whatsapp, "Olá! Vim pelo site da Nasil Vana Store.");
  const ig = s.instagram ? s.instagram.replace(/^@/, "") : null;
  const hasPickup = shipping.some((m) => m.type === "pickup");
  const hasDelivery = shipping.some((m) => m.type !== "pickup");

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />

      {/* ============================== HERO ============================== */}
      {hero && (
        <section aria-labelledby="hero-title" className="relative">
          <div className="relative mx-auto grid max-w-[1600px] lg:min-h-[calc(100svh-var(--header-h))] lg:grid-cols-12 lg:gap-10 lg:px-[var(--gutter)]">
            {/* Imagens */}
            <div className="relative h-[86svh] min-h-[540px] lg:order-2 lg:col-span-7 lg:h-auto lg:min-h-0 lg:py-6">
              {hero.media && (
                <div className="hero-settle absolute inset-0 overflow-hidden lg:inset-y-6 lg:left-[16%] lg:right-0">
                  <Picture media={hero.media} sizes="(min-width: 1024px) 50vw, 100vw" fill priority alt={hero.media.alt ?? ""} />
                </div>
              )}
              {hero.secondary && (
                <div
                  className="unveil absolute bottom-[12%] left-0 hidden aspect-[3/4] w-[30%] overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,.45)] lg:block"
                  style={{ ["--d" as string]: 380 }}
                >
                  <div className="parallax h-full w-full" style={{ ["--p-from" as string]: "4%", ["--p-to" as string]: "-8%" }}>
                    <Picture media={hero.secondary} sizes="18vw" fill alt={hero.secondary.alt ?? ""} />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 via-45% to-transparent to-70% lg:hidden" />
              <p
                className="eyebrow fade-up absolute -right-7 top-1/2 hidden origin-right -rotate-90 whitespace-nowrap text-stone xl:block"
                style={{ ["--d" as string]: 900 }}
              >
                Nasil Vana · {s.addressCity}, {s.addressState}
              </p>
            </div>

            {/* Texto */}
            <div className="absolute inset-x-0 bottom-0 z-10 px-[var(--gutter)] pb-10 text-paper lg:static lg:order-1 lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:px-0 lg:pb-0 lg:text-ink">
              {hero.eyebrow && (
                <p className="eyebrow fade-up flex items-center gap-3 opacity-90" style={{ ["--d" as string]: 200 }}>
                  <span className="h-px w-8 bg-current lg:bg-suede" />
                  {hero.eyebrow}
                </p>
              )}
              <h1 id="hero-title" className="display mt-4 text-[clamp(2.6rem,10.5vw,4rem)] lg:mt-5 lg:text-[clamp(4rem,6vw,6.75rem)]">
                <RisingTitle text={hero.title} base={250} />
              </h1>
              {hero.subtitle && (
                <p className="fade-up mt-4 max-w-md text-[0.9375rem] leading-relaxed opacity-90 lg:mt-6 lg:text-[1.0625rem] lg:text-stone lg:opacity-100" style={{ ["--d" as string]: 750 }}>
                  {hero.subtitle}
                </p>
              )}
              <div className="fade-up mt-7 flex flex-wrap gap-3 lg:mt-9" style={{ ["--d" as string]: 900 }}>
                {hero.ctaHref && (
                  <Link href={hero.ctaHref} className="btn btn-light lg:btn-primary lg:border-ink lg:bg-ink lg:text-paper">
                    {hero.ctaLabel || "Explorar"} <IconArrow size={16} className="btn-arrow" />
                  </Link>
                )}
                {categoryCards[0] && (
                  <Link href={`/loja/${categoryCards[0].slug}`} className="btn border-paper/60 text-paper hover:border-paper lg:btn-outline lg:border-ink lg:text-ink">
                    {categoryCards[0].name}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================ MARQUEE ============================ */}
      <div className="overflow-hidden border-y border-line py-5" aria-hidden="true">
        <div className="marquee-track flex w-max animate-[marquee_38s_linear_infinite] whitespace-nowrap">
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center">
              {[...categoryCards.map((c) => c.name), "Moda feminina", `${s.addressCity}, ${s.addressState}`, "Compra online segura"].map((t, i) => (
                <span key={`${k}-${i}`} className="flex items-center">
                  <span className="serif px-8 text-2xl italic sm:text-3xl">{t}</span>
                  <span className="h-1.5 w-1.5 rotate-45 bg-suede" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============================ SELEÇÃO ============================ */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-[var(--gutter)] pt-24 sm:pt-32" aria-labelledby="sel-title">
          <SectionHead
            index="01"
            eyebrow="Seleção"
            title={
              <span id="sel-title">
                Escolhidas <em>para você</em>
              </span>
            }
            href="/loja"
            cta="Ver tudo"
          />
          <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
            {featured.slice(0, 5).map((p, i) => (
              <div key={p.id} className={i === 0 ? "col-span-2 lg:row-span-2" : ""}>
                <ProductCard
                  product={p}
                  index={i}
                  aspect={i === 0 ? "aspect-[4/5] lg:aspect-[3/4.2]" : "aspect-[2/3]"}
                  sizes={i === 0 ? "(min-width: 1024px) 48vw, 100vw" : "(min-width: 1024px) 23vw, 48vw"}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================== CAMPANHA A =========================== */}
      {campaignA && (
        <section className="mt-28 bg-linen sm:mt-36" aria-labelledby="camp-a">
          <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-[var(--gutter)] py-20 sm:py-28 lg:grid-cols-12">
            <div className="lg:col-span-5" data-reveal>
              {campaignA.eyebrow && <p className="eyebrow text-suede-deep">{campaignA.eyebrow}</p>}
              <h2 id="camp-a" className="display mt-5 text-[clamp(3rem,7vw,6.5rem)]">
                <em>{campaignA.title}</em>
              </h2>
              {campaignA.subtitle && <p className="mt-6 max-w-sm text-stone">{campaignA.subtitle}</p>}
              {campaignA.ctaHref && (
                <Link href={campaignA.ctaHref} className="btn btn-primary mt-9">
                  {campaignA.ctaLabel || "Ver mais"} <IconArrow size={16} className="btn-arrow" />
                </Link>
              )}
            </div>
            <div className="relative lg:col-span-7">
              <div className="grid grid-cols-12 items-end gap-4">
                {campaignA.media && (
                  <div className="col-span-7 overflow-hidden" data-reveal="clip">
                    <div className="parallax relative aspect-[3/4]">
                      <Picture media={campaignA.media} sizes="(min-width:1024px) 34vw, 58vw" fill />
                    </div>
                  </div>
                )}
                {campaignA.secondary && (
                  <div className="col-span-5 -mb-10 overflow-hidden" data-reveal="clip" style={{ ["--d" as string]: 200 }}>
                    <div className="parallax relative aspect-[4/5]" style={{ ["--p-from" as string]: "8%", ["--p-to" as string]: "-10%" }}>
                      <Picture media={campaignA.secondary} sizes="(min-width:1024px) 24vw, 40vw" fill />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================== CATEGORIAS =========================== */}
      {categoryCards.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-[var(--gutter)] pt-28 sm:pt-36" aria-labelledby="cat-title">
          <SectionHead index="02" eyebrow="Categorias" title={<span id="cat-title">Explore <em>por estilo</em></span>} />
          <CategoryIndex categories={categoryCards} />
        </section>
      )}

      {/* =========================== NOVIDADES =========================== */}
      {fresh.length > 0 && (
        <section className="pt-28 sm:pt-36" aria-labelledby="new-title">
          <div className="mx-auto max-w-[1600px] px-[var(--gutter)]">
            <SectionHead index="03" eyebrow="Novidades" title={<span id="new-title">Acabaram <em>de chegar</em></span>} href="/loja?ordem=novidades" cta="Ver novidades" />
          </div>
          <Rail label="Novidades">
            {fresh.map((p, i) => (
              <div key={p.id} className="w-[64vw] shrink-0 snap-start sm:w-[38vw] lg:w-[23vw] xl:w-[19vw]">
                <ProductCard product={p} index={i} sizes="(min-width:1280px) 19vw, (min-width:1024px) 23vw, (min-width:640px) 38vw, 64vw" />
              </div>
            ))}
          </Rail>
        </section>
      )}

      {/* =========================== CAMPANHA B =========================== */}
      {campaignB && (
        <section className="mt-28 bg-ink text-paper sm:mt-36" aria-labelledby="camp-b">
          <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-[var(--gutter)] py-20 sm:py-28 lg:grid-cols-12">
            <div className="order-2 grid grid-cols-12 items-start gap-4 lg:order-1 lg:col-span-7">
              {campaignB.media && (
                <div className="col-span-6 overflow-hidden" data-reveal="clip">
                  <div className="parallax relative aspect-[2/3]">
                    <Picture media={campaignB.media} sizes="(min-width:1024px) 28vw, 50vw" fill />
                  </div>
                </div>
              )}
              {campaignB.secondary && (
                <div className="col-span-6 mt-16 overflow-hidden" data-reveal="clip" style={{ ["--d" as string]: 220 }}>
                  <div className="parallax relative aspect-[2/3]" style={{ ["--p-from" as string]: "10%", ["--p-to" as string]: "-6%" }}>
                    <Picture media={campaignB.secondary} sizes="(min-width:1024px) 28vw, 50vw" fill />
                  </div>
                </div>
              )}
            </div>
            <div className="order-1 lg:order-2 lg:col-span-4 lg:col-start-9" data-reveal>
              {campaignB.eyebrow && <p className="eyebrow text-sand">{campaignB.eyebrow}</p>}
              <h2 id="camp-b" className="display mt-5 text-[clamp(3rem,6vw,5.5rem)]">{campaignB.title}</h2>
              {campaignB.subtitle && <p className="mt-6 max-w-sm text-paper/70">{campaignB.subtitle}</p>}
              {campaignB.ctaHref && (
                <Link href={campaignB.ctaHref} className="btn btn-light mt-9">
                  {campaignB.ctaLabel || "Ver mais"} <IconArrow size={16} className="btn-arrow" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============================ MANIFESTO ============================ */}
      <section className="relative mx-auto max-w-[1600px] overflow-hidden px-[var(--gutter)] py-28 sm:py-40" aria-label="Manifesto">
        <Monogram className="pointer-events-none absolute -right-[6%] top-1/2 h-[120%] w-auto -translate-y-1/2 text-ink/[0.035]" />
        <p className="eyebrow flex items-center gap-3 text-stone" data-reveal>
          <span className="h-px w-8 bg-suede" /> {s.name}
        </p>
        <p className="display scroll-words relative mt-8 max-w-5xl text-[clamp(2rem,4.6vw,4.4rem)] leading-[1.08]">
          {"Peças escolhidas para mulheres que se vestem para si mesmas — com elegância, personalidade e a confiança de quem sabe o que quer."
            .split(" ")
            .map((w, i) => (
              <span key={i}>{w} </span>
            ))}
        </p>
        <Link href="/nossa-historia" className="link-u link-u-on eyebrow mt-10 inline-block" data-reveal>
          Nossa história
        </Link>
      </section>

      {/* ============================ EM BREVE ============================ */}
      {comingSoon.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-[var(--gutter)]" aria-labelledby="soon-title">
          <div className="grid items-center gap-10 border-y border-line py-14 md:grid-cols-12">
            {comingSoon[0].images[0] && (
              <Link href={`/produto/${comingSoon[0].slug}`} className="relative block aspect-[4/5] overflow-hidden md:col-span-4" data-reveal="clip">
                <Picture media={comingSoon[0].images[0]} sizes="(min-width:768px) 30vw, 100vw" fill />
              </Link>
            )}
            <div className="md:col-span-7 md:col-start-6" data-reveal>
              <p className="eyebrow text-suede-deep">Em breve na loja</p>
              <h2 id="soon-title" className="display mt-4 text-[clamp(2.4rem,5vw,4.5rem)]">{comingSoon[0].name}</h2>
              {comingSoon[0].subtitle && <p className="mt-4 text-stone">{comingSoon[0].subtitle}</p>}
              <div className="mt-8 max-w-md">
                {wa ? (
                  <a href={whatsappLink(s.whatsapp, `Olá! Quero ser avisada quando chegar: ${comingSoon[0].name}.`) ?? wa} target="_blank" rel="noopener" className="btn btn-primary">
                    Quero ser avisada <IconArrow size={16} className="btn-arrow" />
                  </a>
                ) : (
                  <NewsletterForm source="em-breve" />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================ CONFIANÇA ============================ */}
      <section className="mx-auto max-w-[1600px] px-[var(--gutter)] pt-24" aria-label="Por que comprar aqui">
        <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <IconLock size={22} />, t: "Pagamento seguro", d: "Pix e cartão pelo Mercado Pago. Não temos acesso aos dados do seu cartão.", href: "/perguntas-frequentes" },
            { icon: <IconReturn size={22} />, t: "7 dias para desistir", d: "Direito de arrependimento em compras online, com reembolso integral.", href: "/trocas-e-devolucoes" },
            wa
              ? { icon: <IconChat size={22} />, t: "Atendimento próximo", d: "Dúvida de tamanho ou combinação? Fale com a gente pelo WhatsApp.", href: wa, external: true }
              : { icon: <IconChat size={22} />, t: "Atendimento próximo", d: "Dúvidas sobre tamanho ou pedido? Fale com a nossa equipe.", href: "/contato" },
            {
              icon: <IconPin size={22} />,
              t: hasPickup ? "Retire em Sinop" : `De ${s.addressCity}, ${s.addressState}`,
              d: hasPickup
                ? `Retire seu pedido na loja sem custo após a confirmação do pagamento.`
                : hasDelivery
                  ? "Entrega com valor e prazo calculados no checkout para o seu CEP."
                  : "Uma loja local com atendimento de verdade.",
              href: "/entrega-e-frete",
            },
          ].map((b) => (
            <li key={b.t} className="bg-paper" data-reveal>
              <a href={b.href} target={"external" in b ? "_blank" : undefined} rel={"external" in b ? "noopener" : undefined} className="group flex h-full flex-col gap-4 p-7 transition-colors hover:bg-paper-2 sm:p-9">
                <span className="text-suede-deep">{b.icon}</span>
                <span className="serif text-xl">{b.t}</span>
                <span className="text-sm leading-relaxed text-stone">{b.d}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ============================ INSTAGRAM ============================ */}
      {ig && (
        <section className="mx-auto max-w-[1600px] px-[var(--gutter)] pt-24 text-center" aria-label="Instagram">
          <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener" className="group inline-flex flex-col items-center gap-4" data-reveal>
            <IconInstagram size={28} />
            <span className="display text-[clamp(2.2rem,6vw,5rem)] transition-colors group-hover:text-suede-deep">@{ig}</span>
            <span className="eyebrow text-stone">Acompanhe as novidades no Instagram</span>
          </a>
        </section>
      )}
    </>
  );
}
