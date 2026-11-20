"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Atualiza a página do pedido enquanto o pagamento está pendente (até ~5 minutos). */
export function AutoRefresh({ active, interval = 5000, maxMs = 5 * 60_000 }: { active: boolean; interval?: number; maxMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - start > maxMs) return window.clearInterval(id);
      router.refresh();
    }, interval);
    return () => window.clearInterval(id);
  }, [active, interval, maxMs, router]);
  return null;
}
