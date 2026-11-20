"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Rolagem com inércia só no desktop com mouse (no celular a rolagem nativa é melhor).
 * Desligada com "movimento reduzido". Painéis (<dialog>) usam data-lenis-prevent.
 */
let lenis: Lenis | null = null;

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    lenis = new Lenis({ autoRaf: true, lerp: 0.09, wheelMultiplier: 0.9, anchors: true });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
