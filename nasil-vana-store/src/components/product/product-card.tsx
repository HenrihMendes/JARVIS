import Link from "next/link";
import { ViewTransition } from "react";
import { Picture } from "@/components/ui/picture";
import { Price } from "@/components/ui/price";
import { SwatchDot } from "@/components/ui/swatch";
import type { ProductCardData } from "@/lib/catalog";

export function ProductCard({
  product: p,
  sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw",
  priority = false,
  index = 0,
  morph = false,
  aspect = "aspect-[2/3]",
}: {
  product: ProductCardData;
  sizes?: string;
  priority?: boolean;
  index?: number;
  morph?: boolean;
  aspect?: string;
}) {
  const [first, second] = p.images;
  const badge = p.status === "coming_soon" ? "Em breve" : !p.inStock ? "Esgotado" : p.isNew ? "Novo" : null;
  const image = first ? (
    <Picture media={first} sizes={sizes} fill priority={priority} className="transition-transform duration-[1.4s] ease-[var(--ease-editorial)] group-hover:scale-[1.035]" />
  ) : (
    <div className="absolute inset-0 grid place-items-center bg-paper-2 text-stone">Sem foto</div>
  );
  return (
    <article className="group relative" data-reveal style={{ ["--d" as string]: (index % 4) * 90 }}>
      <Link href={`/produto/${p.slug}`} className="block focus-visible:outline-offset-4">
        <div className={`relative ${aspect} overflow-hidden bg-paper-2 [@media(hover:hover)_and_(pointer:fine)]:cursor-none`} data-cursor={p.status === "coming_soon" ? "Em breve" : "Ver"}>
          {morph ? <ViewTransition name={`produto-${p.id}`}>{image}</ViewTransition> : image}
          {second && (
            <Picture
              media={second}
              sizes={sizes}
              fill
              className="pointer-events-none opacity-0 transition-opacity duration-700 ease-[var(--ease-editorial)] [@media(hover:hover)]:group-hover:opacity-100"
            />
          )}
          {badge && (
            <span className={`eyebrow absolute left-3 top-3 px-2.5 py-1.5 text-[0.625rem] ${badge === "Esgotado" ? "bg-paper/90 text-stone" : "bg-paper text-ink"}`}>
              {badge}
            </span>
          )}
          <span className="eyebrow absolute inset-x-0 bottom-0 hidden translate-y-full bg-ink/85 py-3.5 text-center text-paper backdrop-blur-sm transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:translate-y-0 [@media(hover:hover)]:block">
            {p.status === "coming_soon" ? "Saiba mais" : p.inStock ? "Escolher tamanho" : "Ver detalhes"}
          </span>
        </div>
        {/* Celular: nome e preço empilhados (sem espremer); desktop: lado a lado */}
        <div className="mt-3 flex flex-col gap-1 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h3 className="serif text-[0.98rem] leading-snug sm:text-lg">{p.name}</h3>
            {p.subtitle && <p className="mt-0.5 hidden truncate text-[0.8125rem] text-stone sm:block">{p.subtitle}</p>}
          </div>
          {p.priceCents != null && p.status === "active" ? (
            <Price cents={p.priceCents} compareAt={p.compareAtCents} className="shrink-0 text-stone sm:pt-0.5 sm:text-ink" />
          ) : (
            <span className="eyebrow shrink-0 text-stone sm:pt-1.5">Em breve</span>
          )}
        </div>
      </Link>
      {p.colors.length > 1 && (
        <div className="mt-2.5 flex items-center gap-1.5" aria-label={`Cores: ${p.colors.map((c) => c.name).join(", ")}`}>
          {p.colors.slice(0, 6).map((c) => (
            <SwatchDot key={c.id} color={c} size={11} />
          ))}
        </div>
      )}
    </article>
  );
}
