"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { IconClose, IconFilter } from "@/components/ui/icons";

export function MobileFilters({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const sp = useSearchParams().toString();
  const [prev, setPrev] = useState(sp);
  if (prev !== sp) {
    setPrev(sp);
    setOpen(false);
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex min-h-10 items-center gap-2 border border-line px-3.5 text-[0.75rem] uppercase tracking-[0.14em] lg:hidden" aria-haspopup="dialog">
        <IconFilter size={16} /> Filtrar{count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] text-paper">{count}</span>}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="bottom" label="Filtros">
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <p className="serif text-2xl">Filtrar</p>
            <button type="button" onClick={() => setOpen(false)} className="-mr-2 grid h-11 w-11 place-items-center" aria-label="Fechar filtros">
              <IconClose />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-6">{children}</div>
          <div className="border-t border-line px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-primary w-full">
              Ver resultados
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
