"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Picture } from "@/components/ui/picture";
import { IconArrow } from "@/components/ui/icons";
import { formatBRL } from "@/lib/money";
import type { MediaLike } from "@/lib/media-url";

type Look = { slug: string; name: string; subtitle: string | null; priceCents: number | null; category: string | null; image: MediaLike };

/**
 * Lookbook com rolagem "presa": a seção fica fixa na tela enquanto os looks se sucedem
 * (foto com zoom/recorte, número gigante, nome e preço). Cada look ocupa ~1 tela de rolagem.
 */
export function Lookbook({ looks }: { looks: Look[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const n = looks.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      setProgress(p);
      setActive(Math.min(n - 1, Math.floor(p * n * 0.999)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [n]);

  if (n === 0) return null;
  const look = looks[active];

  return (
    <section ref={ref} aria-label="Lookbook" className="relative bg-ink text-paper" style={{ height: `${n * 100 + 40}svh` }}>
      <div className="sticky top-0 flex h-svh items-stretch overflow-hidden">
        {/* Fotos */}
        <div className="absolute inset-0 lg:left-auto lg:right-0 lg:w-[52%]">
          {looks.map((l, k) => (
            <div
              key={l.slug}
              className="absolute inset-0 transition-[clip-path,opacity] duration-[1100ms] ease-[var(--ease-curtain)]"
              style={{
                clipPath: k === active ? "inset(0 0 0 0)" : k < active ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)",
                opacity: Math.abs(k - active) > 1 ? 0 : 1,
                zIndex: k === active ? 2 : 1,
              }}
            >
              <div className="h-full w-full transition-transform duration-[1600ms] ease-[var(--ease-editorial)]" style={{ transform: k === active ? "scale(1)" : "scale(1.12)" }}>
                <Picture media={l.image} sizes="(min-width:1024px) 52vw, 100vw" fill alt={l.image.alt ?? l.name} />
              </div>
            </div>
          ))}
          <div className="absolute inset-0 z-[3] bg-gradient-to-t from-ink via-ink/40 to-transparent lg:bg-gradient-to-r lg:from-ink lg:via-transparent lg:to-transparent" />
        </div>

        {/* Texto */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col justify-between px-[var(--gutter)] py-[calc(var(--header-h)+1.5rem)] lg:py-16">
          <div className="flex items-center gap-4">
            <span className="eyebrow text-sand">Lookbook</span>
            <span className="h-px w-16 bg-paper/30" />
            <span className="eyebrow tabular text-paper/70">
              {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
          </div>

          <div className="max-w-xl">
            <div className="relative h-[clamp(7rem,22vw,16rem)] overflow-hidden" aria-hidden="true">
              {looks.map((l, k) => (
                <span
                  key={l.slug}
                  className="display absolute bottom-0 left-0 text-[clamp(7rem,22vw,16rem)] leading-[0.8] text-paper/[0.92] transition-[transform,opacity] duration-[1000ms] ease-[var(--ease-editorial)]"
                  style={{ transform: `translateY(${(k - active) * 135}%)`, opacity: k === active ? 1 : 0 }}
                >
                  {String(k + 1).padStart(2, "0")}
                </span>
              ))}
            </div>
            <div key={look.slug} className="mt-6 [animation:fade-up_.9s_var(--ease-editorial)_both]">
              {look.category && <p className="eyebrow text-sand">{look.category}</p>}
              <h2 className="display mt-3 text-[clamp(2.2rem,5vw,4.2rem)]">{look.name}</h2>
              {look.subtitle && <p className="mt-3 text-paper/70">{look.subtitle}</p>}
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Link href={`/produto/${look.slug}`} className="btn btn-light" data-magnetic>
                  Ver o look <IconArrow size={16} className="btn-arrow" />
                </Link>
                {look.priceCents != null && <span className="serif text-2xl tabular">{formatBRL(look.priceCents)}</span>}
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div className="flex items-center gap-2" aria-hidden="true">
            {looks.map((l, k) => (
              <span key={l.slug} className="relative h-[2px] flex-1 overflow-hidden bg-paper/20 lg:max-w-24">
                <span
                  className="absolute inset-y-0 left-0 bg-paper"
                  style={{ width: `${Math.min(100, Math.max(0, (progress * n - k) * 100))}%` }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
