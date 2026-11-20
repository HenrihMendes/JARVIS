"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconArrow } from "@/components/ui/icons";

/** Trilho horizontal com rolagem nativa (snap), setas no desktop e barra de progresso. */
export function Rail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 1);
      setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-[var(--gutter)] px-[var(--gutter)] pb-2 scrollbar-none sm:gap-5"
      >
        {children}
      </div>
      <div className="mx-auto mt-8 flex max-w-[1600px] items-center gap-6 px-[var(--gutter)]">
        <div className="relative h-px flex-1 bg-line" aria-hidden="true">
          <div className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-300" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
        <div className="hidden gap-2 md:flex">
          <button type="button" onClick={() => by(-1)} disabled={edges.start} className="grid h-12 w-12 place-items-center rounded-full border border-line transition hover:border-ink disabled:opacity-30" aria-label="Anterior">
            <IconArrow size={18} className="rotate-180" />
          </button>
          <button type="button" onClick={() => by(1)} disabled={edges.end} className="grid h-12 w-12 place-items-center rounded-full border border-line transition hover:border-ink disabled:opacity-30" aria-label="Próximo">
            <IconArrow size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
