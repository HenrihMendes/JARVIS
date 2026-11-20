import Link from "next/link";
import { listProducts, type CatalogFilters, type SortKey } from "@/lib/catalog";
import { ProductCard } from "@/components/product/product-card";
import { SwatchDot } from "@/components/ui/swatch";
import { IconClose } from "@/components/ui/icons";
import { formatBRL } from "@/lib/money";
import { MobileFilters } from "./mobile-filters";

export type RawSearch = Record<string, string | string[] | undefined>;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevancia", label: "Destaques" },
  { key: "novidades", label: "Novidades" },
  { key: "menor-preco", label: "Menor preço" },
  { key: "maior-preco", label: "Maior preço" },
];

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((x) => x.trim()).filter(Boolean).slice(0, 12);

export function parseFilters(sp: RawSearch, category?: string): CatalogFilters {
  const num = (v: unknown) => {
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
  };
  const sort = String(sp.ordem ?? "") as SortKey;
  return {
    category,
    q: typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined,
    colors: list(sp.cor),
    sizes: list(sp.tamanho),
    min: num(sp.min),
    max: num(sp.max),
    sort: SORTS.some((s) => s.key === sort) ? sort : "relevancia",
    page: num(sp.pagina) ?? 1,
    onlyAvailable: sp.disponivel === "1",
  };
}

/** Monta URLs de filtro preservando os demais parâmetros (funciona sem JavaScript). */
function buildHref(base: string, f: CatalogFilters, patch: Partial<Record<"cor" | "tamanho" | "min" | "max" | "ordem" | "pagina" | "disponivel" | "q", string | null>>) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.colors?.length) p.set("cor", f.colors.join(","));
  if (f.sizes?.length) p.set("tamanho", f.sizes.join(","));
  if (f.min != null) p.set("min", String(f.min));
  if (f.max != null) p.set("max", String(f.max));
  if (f.sort && f.sort !== "relevancia") p.set("ordem", f.sort);
  if (f.onlyAvailable) p.set("disponivel", "1");
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") p.delete(k);
    else p.set(k, v);
  }
  if (!("pagina" in patch)) p.delete("pagina");
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

const toggle = (arr: string[] | undefined, v: string) => {
  const s = new Set(arr ?? []);
  if (s.has(v)) s.delete(v);
  else s.add(v);
  return [...s].join(",") || null;
};

function priceRanges(min: number, max: number) {
  if (!max) return [];
  const ranges = [
    { label: `Até ${formatBRL(15000)}`, min: null, max: 15000 },
    { label: `${formatBRL(15000)} a ${formatBRL(30000)}`, min: 15000, max: 30000 },
    { label: `Acima de ${formatBRL(30000)}`, min: 30000, max: null },
  ];
  return ranges.filter((r) => (r.max == null || r.max >= min) && (r.min == null || r.min <= max));
}

export async function CatalogView({ base, filters, emptyHint }: { base: string; filters: CatalogFilters; emptyHint?: React.ReactNode }) {
  const { items, total, page, pages, facets } = await listProducts(filters);
  const ranges = priceRanges(facets.priceMin, facets.priceMax);
  const active =
    (filters.colors?.length ?? 0) + (filters.sizes?.length ?? 0) + (filters.min != null || filters.max != null ? 1 : 0) + (filters.onlyAvailable ? 1 : 0);

  const filterPanel = (
    <div className="space-y-9">
      {facets.colors.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-4 text-stone">Cor</legend>
          <ul className="flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const on = filters.colors?.includes(c.name);
              return (
                <li key={c.name}>
                  <Link
                    href={buildHref(base, filters, { cor: toggle(filters.colors, c.name) })}
                    rel="nofollow"
                    scroll={false}
                    aria-pressed={on}
                    className={`flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-[0.8125rem] transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                  >
                    <SwatchDot color={c} size={12} /> {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
      {facets.sizes.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-4 text-stone">Tamanho</legend>
          <ul className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const on = filters.sizes?.includes(s.label);
              return (
                <li key={s.label}>
                  <Link
                    href={buildHref(base, filters, { tamanho: toggle(filters.sizes, s.label) })}
                    rel="nofollow"
                    scroll={false}
                    aria-pressed={on}
                    className={`grid h-10 min-w-12 place-items-center border px-3 text-[0.8125rem] transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                  >
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
      {ranges.length > 1 && (
        <fieldset>
          <legend className="eyebrow mb-4 text-stone">Preço</legend>
          <ul className="space-y-2.5">
            {ranges.map((r) => {
              const on = (filters.min ?? null) === r.min && (filters.max ?? null) === r.max;
              return (
                <li key={r.label}>
                  <Link
                    href={buildHref(base, filters, on ? { min: null, max: null } : { min: r.min?.toString() ?? null, max: r.max?.toString() ?? null })}
                    rel="nofollow"
                    scroll={false}
                    aria-pressed={on}
                    className="flex items-center gap-3 text-[0.9375rem]"
                  >
                    <span className={`grid h-4 w-4 place-items-center rounded-full border ${on ? "border-ink" : "border-mist"}`}>
                      {on && <span className="h-2 w-2 rounded-full bg-ink" />}
                    </span>
                    {r.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
      <Link
        href={buildHref(base, filters, { disponivel: filters.onlyAvailable ? null : "1" })}
        rel="nofollow"
        scroll={false}
        aria-pressed={filters.onlyAvailable}
        className="flex items-center gap-3 text-[0.9375rem]"
      >
        <span className={`relative h-5 w-9 rounded-full transition-colors ${filters.onlyAvailable ? "bg-ink" : "bg-line"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-paper transition-transform ${filters.onlyAvailable ? "translate-x-4.5" : "translate-x-0.5"}`} />
        </span>
        Só peças disponíveis
      </Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1600px] px-[var(--gutter)]">
      {/* Barra de ferramentas */}
      <div className="relative z-20 -mx-[var(--gutter)] flex items-center justify-between gap-4 border-y border-line bg-paper px-[var(--gutter)] py-3">
        <div className="flex items-center gap-3">
          <MobileFilters count={active}>{filterPanel}</MobileFilters>
          <p className="text-[0.8125rem] text-stone" aria-live="polite">
            {total} {total === 1 ? "peça" : "peças"}
          </p>
        </div>
        <nav aria-label="Ordenar" className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <span className="eyebrow mr-2 hidden text-stone sm:inline">Ordenar</span>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={buildHref(base, filters, { ordem: s.key === "relevancia" ? null : s.key })}
              rel="nofollow"
              scroll={false}
              aria-current={filters.sort === s.key ? "true" : undefined}
              className={`whitespace-nowrap px-2.5 py-2 text-[0.75rem] uppercase tracking-[0.12em] ${filters.sort === s.key ? "text-ink underline underline-offset-4" : "text-stone hover:text-ink"}`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Filtros ativos */}
      {active > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-5">
          {filters.colors?.map((c) => (
            <Link key={c} href={buildHref(base, filters, { cor: toggle(filters.colors, c) })} rel="nofollow" scroll={false} className="flex items-center gap-2 rounded-full bg-paper-2 px-3 py-1.5 text-[0.8125rem]">
              {c} <IconClose size={12} />
            </Link>
          ))}
          {filters.sizes?.map((s) => (
            <Link key={s} href={buildHref(base, filters, { tamanho: toggle(filters.sizes, s) })} rel="nofollow" scroll={false} className="flex items-center gap-2 rounded-full bg-paper-2 px-3 py-1.5 text-[0.8125rem]">
              Tam. {s} <IconClose size={12} />
            </Link>
          ))}
          {(filters.min != null || filters.max != null) && (
            <Link href={buildHref(base, filters, { min: null, max: null })} rel="nofollow" scroll={false} className="flex items-center gap-2 rounded-full bg-paper-2 px-3 py-1.5 text-[0.8125rem]">
              {filters.min != null ? formatBRL(filters.min) : "R$ 0"} – {filters.max != null ? formatBRL(filters.max) : "+"} <IconClose size={12} />
            </Link>
          )}
          {filters.onlyAvailable && (
            <Link href={buildHref(base, filters, { disponivel: null })} rel="nofollow" scroll={false} className="flex items-center gap-2 rounded-full bg-paper-2 px-3 py-1.5 text-[0.8125rem]">
              Disponíveis <IconClose size={12} />
            </Link>
          )}
          <Link href={filters.q ? `${base}?q=${encodeURIComponent(filters.q)}` : base} rel="nofollow" scroll={false} className="link-u ml-2 text-[0.75rem] uppercase tracking-[0.14em]">
            Limpar filtros
          </Link>
        </div>
      )}

      <div className="grid gap-10 pt-8 lg:grid-cols-[15rem_1fr] lg:gap-14">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-[calc(var(--header-h)+5rem)]">{filterPanel}</div>
        </aside>

        <section aria-labelledby="lista-produtos">
          <h2 id="lista-produtos" className="sr-only">Produtos</h2>
          {items.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-start justify-center gap-6 border border-dashed border-line p-10 sm:p-16">
              <p className="display text-[clamp(2.2rem,5vw,3.8rem)]">
                Nada por aqui <em>ainda.</em>
              </p>
              <p className="max-w-md text-stone">
                {filters.q ? <>Não encontramos peças para &ldquo;{filters.q}&rdquo;. Tente outra palavra ou explore a loja.</> : "Nenhuma peça corresponde aos filtros escolhidos."}
              </p>
              {emptyHint}
              <div className="flex flex-wrap gap-3">
                {active > 0 && (
                  <Link href={base} className="btn btn-outline">
                    Limpar filtros
                  </Link>
                )}
                <Link href="/loja" className="btn btn-primary">
                  Ver toda a loja
                </Link>
              </div>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
                {items.map((p, i) => (
                  <li key={p.id}>
                    <ProductCard product={p} index={i} priority={i < 2} morph sizes="(min-width: 1280px) 20vw, (min-width: 768px) 28vw, 46vw" />
                  </li>
                ))}
              </ul>
              {page < pages && (
                <div className="mt-16 flex flex-col items-center gap-4">
                  <p className="text-[0.8125rem] text-stone">
                    Mostrando {items.length} de {total}
                  </p>
                  <Link href={buildHref(base, filters, { pagina: String(page + 1) })} scroll={false} className="btn btn-outline" rel="nofollow">
                    Carregar mais peças
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
