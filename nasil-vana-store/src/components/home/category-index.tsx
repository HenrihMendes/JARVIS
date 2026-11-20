"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Picture } from "@/components/ui/picture";
import { IconArrow } from "@/components/ui/icons";
import type { MediaLike } from "@/lib/media-url";

type Cat = { slug: string; name: string; description: string | null; count: number; cover: MediaLike | null };

/**
 * Índice editorial de categorias. No desktop, a foto da categoria acompanha o cursor
 * (com inércia suave); no celular vira uma faixa horizontal de cartões.
 */
export function CategoryIndex({ categories }: { categories: Cat[] }) {
  const [active, setActive] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const floating = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  const loop = () => {
    pos.current.x += (target.current.x - pos.current.x) * 0.14;
    pos.current.y += (target.current.y - pos.current.y) * 0.14;
    if (floating.current) floating.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
    raf.current = requestAnimationFrame(loop);
  };

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !box.current) return;
    const r = box.current.getBoundingClientRect();
    target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (raf.current == null) {
      pos.current = { ...target.current };
      raf.current = requestAnimationFrame(loop);
    }
  };
  const stop = () => {
    setActive(null);
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  return (
    <>
      {/* Desktop */}
      <div ref={box} className="relative hidden md:block" onPointerMove={onMove} onPointerLeave={stop}>
        <ul className="border-t border-line">
          {categories.map((c, i) => (
            <li key={c.slug} className="border-b border-line" data-reveal style={{ ["--d" as string]: i * 70 }}>
              <Link
                href={`/loja/${c.slug}`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="group relative z-10 grid grid-cols-[4rem_1fr_auto] items-center gap-6 py-7 transition-colors duration-500 hover:text-suede-deep"
              >
                <span className="eyebrow text-stone">{String(i + 1).padStart(2, "0")}</span>
                <span className="display text-[clamp(2.6rem,6vw,5.5rem)] transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:translate-x-4">
                  {c.name}
                </span>
                <span className="flex items-center gap-4 text-sm text-stone">
                  {c.count} {c.count === 1 ? "peça" : "peças"}
                  <IconArrow size={22} className="-translate-x-3 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div
          ref={floating}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-0 aspect-[3/4] w-[clamp(220px,20vw,320px)]"
          style={{ willChange: "transform" }}
        >
          {categories.map((c, i) =>
            c.cover ? (
              <div
                key={c.slug}
                className="absolute inset-0 aspect-[3/4] overflow-hidden transition-[opacity,clip-path] duration-700 ease-[var(--ease-curtain)]"
                style={{
                  opacity: active === i ? 1 : 0,
                  clipPath: active === i ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                }}
              >
                <Picture media={c.cover} sizes="320px" fill alt="" />
              </div>
            ) : null,
          )}
        </div>
      </div>

      {/* Celular */}
      <div className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-2 scrollbar-none md:hidden">
        {categories.map((c, i) => (
          <Link key={c.slug} href={`/loja/${c.slug}`} className="relative block w-[68vw] shrink-0 snap-start" data-reveal style={{ ["--d" as string]: i * 70 }}>
            <div className="relative aspect-[3/4] overflow-hidden bg-paper-2">
              {c.cover && <Picture media={c.cover} sizes="70vw" fill alt="" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-paper">
                <span className="eyebrow opacity-80">{String(i + 1).padStart(2, "0")}</span>
                <p className="display mt-1 text-4xl">{c.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
