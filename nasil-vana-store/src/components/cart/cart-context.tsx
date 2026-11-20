"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import {
  addToCartAction,
  applyCouponAction,
  getCartAction,
  removeCouponAction,
  removeFromCartAction,
  updateQuantityAction,
  type CartResult,
} from "@/app/actions/cart";
import type { CartSnapshot } from "@/lib/cart";

type Toast = { id: number; message: string; tone: "ok" | "error" };

type CartCtx = {
  cart: CartSnapshot | null;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  pending: boolean;
  add: (variantId: string, qty?: number) => Promise<CartResult>;
  update: (variantId: string, qty: number) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<CartResult>;
  removeCoupon: () => Promise<void>;
  refresh: () => Promise<void>;
  toast: (message: string, tone?: Toast["tone"]) => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartSnapshot | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const toast = useCallback((message: string, tone: Toast["tone"] = "ok") => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const refresh = useCallback(async () => {
    const c = await getCartAction();
    setCart(c);
    for (const n of c.notices) toast(n, "error");
  }, [toast]);

  useEffect(() => {
    void refresh();
    // Revalida quando a aba volta ao foco (estoque/preço podem ter mudado)
    const onVis = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const run = useCallback(
    (fn: () => Promise<CartResult>) =>
      new Promise<CartResult>((resolve) => {
        startTransition(async () => {
          const r = await fn();
          setCart(r.cart);
          if (r.message) toast(r.message, r.ok ? "ok" : "error");
          resolve(r);
        });
      }),
    [toast],
  );

  const value = useMemo<CartCtx>(
    () => ({
      cart,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      pending,
      add: async (variantId, qty = 1) => {
        const r = await run(() => addToCartAction(variantId, qty));
        if (r.ok) setOpen(true);
        return r;
      },
      update: async (variantId, qty) => void (await run(() => updateQuantityAction(variantId, qty))),
      remove: async (variantId) => void (await run(() => removeFromCartAction(variantId))),
      applyCoupon: (code) => run(() => applyCouponAction(code)),
      removeCoupon: async () => void (await run(() => removeCouponAction())),
      refresh,
      toast,
    }),
    [cart, isOpen, pending, run, refresh, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-md px-5 py-3 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] [animation:fade-up_.5s_var(--ease-editorial)_both] ${
              t.tone === "error" ? "bg-ink text-paper" : "bg-paper text-ink ring-1 ring-line"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
