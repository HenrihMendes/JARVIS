"use client";

import { useEffect, useMemo, useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Picture } from "@/components/ui/picture";
import { Price, Installments } from "@/components/ui/price";
import { Sheet } from "@/components/ui/sheet";
import { IconClose, IconZoom, IconWhatsapp, IconRuler, IconCheck, IconArrow } from "@/components/ui/icons";
import { useCart } from "@/components/cart/cart-context";
import type { ProductDetail } from "@/lib/catalog";
import type { MediaLike } from "@/lib/media-url";
import { mediaSrc, largest } from "@/lib/media-url";

type Props = {
  product: ProductDetail;
  maxInstallments: number | null;
  installmentNote: string;
  lowStockThreshold: number;
  showLowStock: boolean;
  whatsapp: string | null;
  sizeGuide: React.ReactNode | null;
  children?: React.ReactNode;
};

export function ProductExperience({ product: p, maxInstallments, installmentNote, lowStockThreshold, showLowStock, whatsapp, sizeGuide, children }: Props) {
  const sp = useSearchParams();
  const { add, pending } = useCart();
  const initialColor = useMemo(() => {
    const byName = p.colorOptions.find((c) => c.name === sp.get("cor"));
    if (byName) return byName.id;
    // Primeira cor com estoque
    const withStock = p.variants.find((v) => v.stock > 0 && v.colorId);
    return withStock?.colorId ?? p.colorOptions[0]?.id ?? null;
  }, [p, sp]);
  const [colorId, setColorId] = useState<string | null>(initialColor);
  const [sizeId, setSizeId] = useState<string | null>(() => {
    const s = p.sizeOptions.find((o) => o.label === sp.get("tamanho"));
    if (s) return s.id;
    return p.sizeOptions.length === 1 ? p.sizeOptions[0].id : null;
  });
  const [sizeError, setSizeError] = useState(false);
  const [guide, setGuide] = useState(false);
  const [added, setAdded] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const variantsForColor = p.variants.filter((v) => !colorId || v.colorId === colorId);
  const needsSize = p.sizeOptions.length > 0;
  const selected = p.variants.find((v) => (colorId ? v.colorId === colorId : true) && (needsSize ? v.sizeId === sizeId : true)) ?? null;
  const colorName = p.colorOptions.find((c) => c.id === colorId)?.name;
  const sellable = p.status === "active" && p.priceCents != null && p.variants.length > 0;
  const price = selected?.priceCents ?? p.priceCents ?? 0;

  // Galeria: fotos da cor escolhida primeiro
  const gallery = useMemo(() => {
    if (!colorId) return p.gallery;
    const mine = p.gallery.filter((g) => g.colorId === colorId);
    const neutral = p.gallery.filter((g) => !g.colorId);
    return mine.length ? [...mine, ...neutral] : p.gallery;
  }, [p.gallery, colorId]);

  const stockLabel = (() => {
    if (!sellable) return null;
    if (!selected) {
      const any = variantsForColor.some((v) => v.stock > 0);
      return any ? null : "Esgotado nesta cor";
    }
    if (selected.stock <= 0) return "Esgotado";
    if (showLowStock && selected.stock <= lowStockThreshold) return selected.stock === 1 ? "Última unidade" : `Últimas ${selected.stock} unidades`;
    return "Disponível";
  })();

  const onAdd = async () => {
    if (needsSize && !sizeId) {
      setSizeError(true);
      document.getElementById("tamanhos")?.focus();
      return;
    }
    if (!selected || selected.stock <= 0) return;
    const r = await add(selected.id, 1);
    if (r.ok) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2400);
    }
  };

  const waHref = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre ${p.name}${colorName ? ` (${colorName})` : ""}.`)}`
    : null;

  const buyButtonLabel = !sellable
    ? "Indisponível"
    : selected && selected.stock <= 0
      ? "Esgotado"
      : added
        ? "Adicionado à sacola"
        : needsSize && !sizeId
          ? "Selecione o tamanho"
          : "Adicionar à sacola";

  return (
    <div className="mx-auto grid max-w-[1600px] gap-8 lg:grid-cols-12 lg:gap-14 lg:px-[var(--gutter)]">
      <Gallery images={gallery} name={p.name} productId={p.id} />

      <div className="px-[var(--gutter)] lg:col-span-5 lg:px-0">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          {children}
          <h1 className="display mt-4 text-[clamp(2.4rem,4vw,3.6rem)]">{p.name}</h1>
          {p.subtitle && <p className="mt-2 text-stone">{p.subtitle}</p>}

          <div className="mt-6 flex flex-col gap-1">
            {p.status === "coming_soon" || p.priceCents == null ? (
              <p className="eyebrow text-suede-deep">Em breve</p>
            ) : (
              <>
                <Price cents={price} compareAt={p.compareAtCents} size="lg" />
                <Installments max={maxInstallments} note={installmentNote} />
              </>
            )}
          </div>

          {sellable && (
            <div className="mt-9 space-y-8">
              {p.colorOptions.length > 0 && (
                <fieldset>
                  <legend className="eyebrow mb-3 text-stone">
                    Cor: <span className="text-ink">{colorName ?? "—"}</span>
                  </legend>
                  <div className="flex flex-wrap gap-2.5">
                    {p.colorOptions.map((c) => {
                      const hasStock = p.variants.some((v) => v.colorId === c.id && v.stock > 0);
                      const on = c.id === colorId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setColorId(c.id);
                            if (sizeId && !p.variants.some((v) => v.colorId === c.id && v.sizeId === sizeId)) setSizeId(p.sizeOptions.length === 1 ? sizeId : null);
                          }}
                          aria-pressed={on}
                          aria-label={`${c.name}${hasStock ? "" : " (esgotado)"}`}
                          title={c.name}
                          className={`relative grid h-11 w-11 place-items-center rounded-full transition ${on ? "ring-1 ring-ink ring-offset-2 ring-offset-paper" : "hover:ring-1 hover:ring-mist hover:ring-offset-2 hover:ring-offset-paper"}`}
                        >
                          <span className="h-8 w-8 rounded-full ring-1 ring-black/15" style={{ background: c.swatch ?? c.hex ?? "#ccc" }} />
                          {!hasStock && <span className="absolute h-px w-9 rotate-45 bg-ink/70" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {needsSize && (
                <fieldset>
                  <div className="mb-3 flex items-center justify-between">
                    <legend className="eyebrow text-stone">
                      Tamanho{sizeId ? <>: <span className="text-ink">{p.sizeOptions.find((s) => s.id === sizeId)?.label}</span></> : null}
                    </legend>
                    {sizeGuide && (
                      <button type="button" onClick={() => setGuide(true)} className="link-u link-u-on flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.14em]">
                        <IconRuler size={16} /> Guia de medidas
                      </button>
                    )}
                  </div>
                  <div id="tamanhos" tabIndex={-1} role="radiogroup" aria-label="Tamanho" aria-invalid={sizeError} className="flex flex-wrap gap-2 focus:outline-none">
                    {p.sizeOptions.map((s) => {
                      const v = p.variants.find((x) => x.sizeId === s.id && (!colorId || x.colorId === colorId));
                      const disabled = !v || v.stock <= 0;
                      const on = s.id === sizeId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={disabled}
                          onClick={() => {
                            setSizeId(s.id);
                            setSizeError(false);
                          }}
                          className={`relative grid h-12 min-w-14 place-items-center border px-4 text-sm transition ${
                            on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                          } disabled:cursor-not-allowed disabled:text-mist disabled:hover:border-line`}
                        >
                          {s.label}
                          {disabled && <span className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-mist" aria-hidden="true" />}
                          <span className="sr-only">{disabled ? " (indisponível)" : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                  {sizeError && (
                    <p role="alert" className="field-error">
                      Escolha um tamanho para continuar.
                    </p>
                  )}
                  {p.fitNotes && <p className="mt-3 text-[0.8125rem] leading-relaxed text-stone">{p.fitNotes}</p>}
                </fieldset>
              )}

              <div>
                {stockLabel && (
                  <p className="mb-3 flex items-center gap-2 text-[0.8125rem]">
                    <span className={`h-1.5 w-1.5 rounded-full ${stockLabel.startsWith("Esgotado") ? "bg-danger" : stockLabel === "Disponível" ? "bg-ok" : "bg-warn"}`} />
                    {stockLabel}
                  </p>
                )}
                <button ref={ctaRef} type="button" onClick={onAdd} disabled={pending || (selected != null && selected.stock <= 0)} className="btn btn-primary w-full" aria-live="polite">
                  {added && <IconCheck size={18} />}
                  {buyButtonLabel}
                </button>
                {waHref && (
                  <a href={waHref} target="_blank" rel="noopener" className="btn btn-outline mt-3 w-full">
                    <IconWhatsapp size={18} /> Tirar dúvidas no WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {p.status === "coming_soon" && (
            <div className="mt-8 space-y-3">
              <p className="text-stone">Esta peça chega em breve. Fale com a gente para ser avisada.</p>
              {waHref ? (
                <a href={waHref} target="_blank" rel="noopener" className="btn btn-primary w-full">
                  <IconWhatsapp size={18} /> Quero ser avisada
                </a>
              ) : (
                <Link href="/contato" className="btn btn-primary w-full">
                  Fale com a gente <IconArrow size={16} className="btn-arrow" />
                </Link>
              )}
            </div>
          )}

          <div id="detalhes" />
        </div>
      </div>

      {/* Barra fixa de compra no celular */}
      {sellable && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-500 ease-[var(--ease-editorial)] lg:hidden ${
            ctaVisible ? "translate-y-full" : "translate-y-0"
          }`}
          aria-hidden={ctaVisible}
        >
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="serif truncate">{p.name}</p>
              <p className="text-sm tabular text-stone">{(price / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            </div>
            <button
              type="button"
              tabIndex={ctaVisible ? -1 : 0}
              onClick={() => (needsSize && !sizeId ? ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }) : onAdd())}
              disabled={pending || (selected != null && selected.stock <= 0)}
              className="btn btn-primary !min-h-12 shrink-0 !px-5"
            >
              {needsSize && !sizeId ? "Escolher tamanho" : added ? "Adicionado" : "Adicionar"}
            </button>
          </div>
        </div>
      )}

      {sizeGuide && (
        <Sheet open={guide} onClose={() => setGuide(false)} side="right" labelledBy="guia-titulo">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 id="guia-titulo" className="serif text-2xl">
                Guia de medidas
              </h2>
              <button type="button" onClick={() => setGuide(false)} className="-mr-2 grid h-11 w-11 place-items-center" aria-label="Fechar">
                <IconClose />
              </button>
            </div>
            <div className="prose-nv overflow-y-auto px-6 pb-10">{sizeGuide}</div>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* --------------------------------- Galeria --------------------------------- */

function Gallery({ images, name, productId }: { images: (MediaLike & { colorId: string | null })[]; name: string; productId: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    track.current?.scrollTo({ left: 0 });
  }, [images]);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (!images.length) return <div className="aspect-[3/4] bg-paper-2 lg:col-span-7" />;

  const wide = (i: number) => images.length === 1 || (images.length % 2 === 1 && i === 0);
  return (
    <div className="relative lg:col-span-7">
      {/* Uma única lista: carrossel com "snap" no celular, grade editorial no desktop */}
      <div
        ref={track}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible"
        aria-label={`Fotos de ${name}`}
      >
        {images.map((m, i) => {
          const pic = (
            <Picture
              media={m}
              sizes={wide(i) ? "(min-width:1024px) 55vw, 100vw" : "(min-width:1024px) 28vw, 100vw"}
              fill
              priority={i === 0}
              className="transition-transform duration-[1.2s] ease-[var(--ease-editorial)] lg:group-hover:scale-[1.02]"
            />
          );
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setZoom(i)}
              className={`group relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-paper-2 lg:cursor-zoom-in ${wide(i) ? "lg:col-span-2 lg:aspect-[4/5]" : "lg:aspect-[2/3]"}`}
              aria-label={`Ampliar foto ${i + 1} de ${images.length}`}
            >
              {i === 0 ? <ViewTransition name={`produto-${productId}`}>{pic}</ViewTransition> : pic}
              <span className="absolute bottom-4 right-4 hidden h-10 w-10 place-items-center rounded-full bg-paper/90 opacity-0 transition group-hover:opacity-100 lg:grid">
                <IconZoom size={18} />
              </span>
            </button>
          );
        })}
      </div>
      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-[calc(100vw*4/3-1.25rem)] flex justify-center gap-1.5 lg:hidden" aria-hidden="true">
          {images.map((m, i) => (
            <span key={m.key} className={`h-[3px] rounded-full bg-paper shadow transition-all duration-500 ${i === index ? "w-6 opacity-100" : "w-3 opacity-60"}`} />
          ))}
        </div>
      )}

      <Lightbox images={images} start={zoom} onClose={() => setZoom(null)} name={name} />
    </div>
  );
}

function Lightbox({ images, start, onClose, name }: { images: MediaLike[]; start: number | null; onClose: () => void; name: string }) {
  const [i, setI] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  useEffect(() => {
    if (start != null) {
      setI(start);
      setZoomed(false);
    }
  }, [start]);
  useEffect(() => {
    if (start == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((x) => (x + 1) % images.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, images.length]);
  const m = images[i];
  return (
    <Sheet open={start != null} onClose={onClose} side="full" label={`Fotos de ${name}`}>
      <div className="relative flex h-full w-full items-center justify-center bg-paper">
        {m && (
          <div
            className={`relative h-full w-full overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
              setZoomed((z) => !z);
            }}
            onPointerMove={(e) => {
              if (!zoomed || e.pointerType !== "mouse") return;
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            }}
            style={{ touchAction: "pinch-zoom" }}
          >
            <img
              key={m.key}
              src={mediaSrc(m.key, largest(m), "webp")}
              alt={m.alt ?? ""}
              width={m.width}
              height={m.height}
              className="h-full w-full select-none object-contain transition-transform duration-500 ease-[var(--ease-editorial)] [animation:fade_.4s_ease]"
              style={{ transform: zoomed ? "scale(2.2)" : "none", transformOrigin: origin }}
              draggable={false}
            />
          </div>
        )}
        <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-paper/90" aria-label="Fechar">
          <IconClose />
        </button>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => { setI((x) => (x - 1 + images.length) % images.length); setZoomed(false); }} className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-paper/90" aria-label="Foto anterior">
              <IconArrow size={18} className="rotate-180" />
            </button>
            <button type="button" onClick={() => { setI((x) => (x + 1) % images.length); setZoomed(false); }} className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-paper/90" aria-label="Próxima foto">
              <IconArrow size={18} />
            </button>
            <p className="eyebrow absolute bottom-5 left-1/2 -translate-x-1/2 tabular text-stone">
              {i + 1} / {images.length}
            </p>
          </>
        )}
      </div>
    </Sheet>
  );
}
