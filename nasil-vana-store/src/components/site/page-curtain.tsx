"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Monogram } from "@/components/brand/logo";

/**
 * Transição entre páginas: uma cortina na cor da marca sobe ao clicar num link interno
 * e se abre quando a nova página chega. Não bloqueia a navegação (ela começa no clique).
 */
export function PageCurtain() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "in" | "out">("idle");
  const started = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return; // filtros/âncoras na mesma página
      if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/media") || url.pathname.startsWith("/api")) return;
      started.current = performance.now();
      setState("in");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Garante que a cortina cubra a tela antes de abrir (mín. 420 ms)
    const wait = Math.max(0, 420 - (performance.now() - started.current));
    const t1 = window.setTimeout(() => setState("out"), wait);
    const t2 = window.setTimeout(() => setState("idle"), wait + 900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  // Segurança: nunca deixa a cortina presa (ex.: navegação cancelada)
  useEffect(() => {
    if (state !== "in") return;
    const t = window.setTimeout(() => setState("out"), 2500);
    return () => window.clearTimeout(t);
  }, [state]);

  if (state === "idle") return null;
  return (
    <div aria-hidden="true" className={`page-curtain ${state === "in" ? "is-in" : "is-out"}`}>
      <Monogram className="h-10 w-auto text-paper/90" />
    </div>
  );
}
