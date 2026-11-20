"use client";

import Link from "next/link";
import { useCart } from "./cart-context";
import { Sheet } from "@/components/ui/sheet";
import { Picture } from "@/components/ui/picture";
import { IconClose, IconLock, IconMinus, IconPlus, IconArrow } from "@/components/ui/icons";
import { formatBRL } from "@/lib/money";
import type { CartLine } from "@/lib/cart";

export function QtyStepper({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const { update, pending } = useCart();
  const max = Math.min(line.stock, 10);
  return (
    <div className={`inline-flex items-center border border-line ${compact ? "h-9" : "h-11"}`} role="group" aria-label={`Quantidade de ${line.name}`}>
      <button
        type="button"
        className="grid h-full w-9 place-items-center text-ink/80 hover:text-ink disabled:opacity-30"
        onClick={() => update(line.variantId, line.quantity - 1)}
        disabled={pending}
        aria-label="Diminuir quantidade"
      >
        <IconMinus size={14} />
      </button>
      <span className="w-7 text-center text-sm tabular" aria-live="polite">
        {line.quantity}
      </span>
      <button
        type="button"
        className="grid h-full w-9 place-items-center text-ink/80 hover:text-ink disabled:opacity-30"
        onClick={() => update(line.variantId, line.quantity + 1)}
        disabled={pending || line.quantity >= max}
        aria-label="Aumentar quantidade"
      >
        <IconPlus size={14} />
      </button>
    </div>
  );
}

export function CartLineRow({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { remove, pending } = useCart();
  return (
    <li className="grid grid-cols-[5.5rem_1fr] gap-4 py-5 sm:grid-cols-[6.5rem_1fr]">
      <Link href={`/produto/${line.slug}`} onClick={onNavigate} className="relative block aspect-[3/4] overflow-hidden bg-paper-2">
        {line.image && <Picture media={line.image} sizes="120px" fill alt="" />}
      </Link>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/produto/${line.slug}`} onClick={onNavigate} className="serif block text-[1.05rem] leading-tight hover:underline">
              {line.name}
            </Link>
            {line.variantLabel && <p className="mt-1 text-[0.8125rem] text-stone">{line.variantLabel}</p>}
          </div>
          <p className="shrink-0 text-sm tabular">{formatBRL(line.lineTotalCents)}</p>
        </div>
        {line.notice && <p className="mt-2 text-[0.8125rem] text-warn">{line.notice}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <QtyStepper line={line} compact />
          <button
            type="button"
            onClick={() => remove(line.variantId)}
            disabled={pending}
            className="link-u text-[0.75rem] uppercase tracking-[0.14em] text-stone hover:text-ink"
          >
            Remover
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer() {
  const { cart, isOpen, close, pending } = useCart();
  const lines = cart?.lines ?? [];
  const discount = cart?.coupon?.ok ? cart.coupon.discountCents : 0;
  return (
    <Sheet open={isOpen} onClose={close} side="right" labelledBy="cart-title">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 id="cart-title" className="serif text-2xl">
            Sua sacola {cart && cart.count > 0 && <span className="ml-1 align-top text-sm text-stone tabular">({cart.count})</span>}
          </h2>
          <button type="button" onClick={close} className="-mr-2 grid h-11 w-11 place-items-center" aria-label="Fechar sacola">
            <IconClose />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <p className="display text-4xl">
              Sua sacola
              <br />
              <em>está vazia.</em>
            </p>
            <p className="max-w-xs text-sm text-stone">Escolha suas peças favoritas e elas aparecem aqui.</p>
            <Link href="/loja" onClick={close} className="btn btn-primary">
              Ver a loja <IconArrow size={16} className="btn-arrow" />
            </Link>
          </div>
        ) : (
          <>
            <ul className={`flex-1 divide-y divide-line overflow-y-auto px-6 transition-opacity ${pending ? "opacity-60" : ""}`}>
              {lines.map((l) => (
                <CartLineRow key={l.variantId} line={l} onNavigate={close} />
              ))}
            </ul>
            <footer className="border-t border-line px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone">Subtotal</dt>
                  <dd className="tabular">{formatBRL(cart!.subtotalCents)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-ok">
                    <dt>Cupom {cart!.couponCode}</dt>
                    <dd className="tabular">− {formatBRL(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-stone">
                  <dt>Frete</dt>
                  <dd>calculado no checkout</dd>
                </div>
              </dl>
              <Link href="/checkout" onClick={close} className="btn btn-primary mt-5 w-full">
                <IconLock size={16} /> Finalizar compra
              </Link>
              <Link href="/carrinho" onClick={close} className="mt-3 block text-center text-[0.75rem] uppercase tracking-[0.16em] text-stone hover:text-ink">
                Ver sacola completa
              </Link>
            </footer>
          </>
        )}
      </div>
    </Sheet>
  );
}
