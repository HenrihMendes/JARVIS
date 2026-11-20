"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Painel modal acessível baseado em <dialog>: foco preso, Esc fecha, fundo inerte,
 * leitores de tela anunciam o título. Animação em CSS (@starting-style).
 */
export function Sheet({
  open,
  onClose,
  side = "right",
  labelledBy,
  label,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  side?: "right" | "left" | "top" | "full" | "bottom";
  labelledBy?: string;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
    if (!open) document.documentElement.style.overflow = "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={label}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      data-lenis-prevent
      className={`sheet sheet-${side} ${className}`}
    >
      {children}
    </dialog>
  );
}
