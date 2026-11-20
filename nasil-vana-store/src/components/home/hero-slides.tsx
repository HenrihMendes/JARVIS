"use client";

import { useEffect, useState } from "react";
import { Picture } from "@/components/ui/picture";
import type { MediaLike } from "@/lib/media-url";

/**
 * Abertura cinematográfica: as fotos se alternam com dissolve lento e um zoom contínuo
 * ("Ken Burns"). A primeira foto é visível desde o primeiro quadro (bom para o LCP).
 * No desktop, uma miniatura mostra o próximo look e avança ao clicar.
 * Pausa quando a aba está oculta e não anima com "movimento reduzido".
 */
export function HeroSlides({ slides, interval = 5600 }: { slides: MediaLike[]; interval?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (n < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible" && !paused) setI((x) => (x + 1) % n);
    }, interval);
    return () => window.clearInterval(id);
  }, [n, interval, paused]);

  const next = slides[(i + 1) % n];

  return (
    <>
      <div className="absolute inset-0 overflow-hidden lg:inset-y-6 lg:left-[16%] lg:right-0" aria-roledescription="apresentação">
        {slides.map((m, k) => (
          <div
            key={m.key}
            className="absolute inset-0 transition-opacity duration-[1600ms] ease-[var(--ease-editorial)]"
            style={{ opacity: k === i ? 1 : 0 }}
            aria-hidden={k !== i}
          >
            <div className={`h-full w-full ${k === i ? "kenburns" : ""}`}>
              <Picture media={m} sizes="(min-width: 1024px) 50vw, 100vw" fill priority={k === 0} alt={m.alt ?? ""} />
            </div>
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          {/* Miniatura do próximo look (desktop) */}
          <button
            type="button"
            onClick={() => setI((x) => (x + 1) % n)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="unveil group absolute bottom-[12%] left-0 hidden aspect-[3/4] w-[30%] overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,.45)] lg:block"
            style={{ ["--d" as string]: 380 }}
            aria-label="Ver próximo look"
          >
            <div key={next.key} className="absolute inset-0 [animation:fade_.9s_ease_both]">
              <Picture media={next} sizes="18vw" fill alt="" className="transition-transform duration-[1.2s] ease-[var(--ease-editorial)] group-hover:scale-105" />
            </div>
            <span className="eyebrow absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-4 pb-3 pt-10 text-left text-paper">Próximo look →</span>
          </button>

          {/* Indicador */}
          <div className="absolute right-[var(--gutter)] top-5 z-10 flex items-center gap-3 text-paper lg:right-4 lg:top-10" aria-hidden="true">
            <span className="eyebrow tabular">{String(i + 1).padStart(2, "0")}</span>
            <span className="relative h-px w-10 bg-paper/40">
              <span key={i} className="absolute inset-y-0 left-0 bg-paper [animation:hero-progress_linear_both]" style={{ animationDuration: `${interval}ms` }} />
            </span>
            <span className="eyebrow tabular opacity-70">{String(n).padStart(2, "0")}</span>
          </div>
        </>
      )}
    </>
  );
}
