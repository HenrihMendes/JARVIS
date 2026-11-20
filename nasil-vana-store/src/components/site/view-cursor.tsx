"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor editorial (só desktop com mouse): sobre fotos marcadas com data-cursor,
 * um círculo com o texto ("Ver", "Ampliar"…) segue o mouse com inércia suave.
 */
export function ViewCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let raf = 0;
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const el = (e.target as Element | null)?.closest?.("[data-cursor]");
      setLabel(el ? el.getAttribute("data-cursor") : null);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={dot} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[70] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      <div
        className={`grid h-20 w-20 place-items-center rounded-full bg-paper/90 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink shadow-[0_10px_30px_-10px_rgba(0,0,0,.35)] backdrop-blur-sm transition-[transform,opacity] duration-500 ease-[var(--ease-editorial)] ${
          label ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
