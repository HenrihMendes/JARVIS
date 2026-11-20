"use client";

import Link from "next/link";
import { useCart } from "./cart-context";
import { CartLineRow } from "./cart-drawer";
import { IconLock, IconArrow } from "@/components/ui/icons";
import { formatBRL } from "@/lib/money";

export function CartPageClient() {
  const { cart } = useCart();
  if (!cart) return <div className="mx-auto max-w-[1400px] px-[var(--gutter)]"><div className="skeleton h-64" /></div>;
  if (cart.lines.length === 0)
    return (
      <div className="mx-auto max-w-[1400px] px-[var(--gutter)] py-16">
        <p className="text-stone">Sua sacola está vazia.</p>
        <Link href="/loja" className="btn btn-primary mt-8">Ver a loja <IconArrow size={16} className="btn-arrow" /></Link>
      </div>
    );
  const discount = cart.coupon?.ok ? cart.coupon.discountCents : 0;
  return (
    <div className="mx-auto grid max-w-[1400px] gap-12 px-[var(--gutter)] lg:grid-cols-12">
      <ul className="divide-y divide-line border-y border-line lg:col-span-8">
        {cart.lines.map((l) => <CartLineRow key={l.variantId} line={l} />)}
      </ul>
      <aside className="lg:col-span-4">
        <div className="bg-paper-2/60 p-8">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular">{formatBRL(cart.subtotalCents)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-ok"><dt>Cupom {cart.couponCode}</dt><dd className="tabular">− {formatBRL(discount)}</dd></div>}
            <div className="flex justify-between text-stone"><dt>Entrega</dt><dd>no checkout</dd></div>
          </dl>
          <Link href="/checkout" className="btn btn-primary mt-6 w-full"><IconLock size={16} /> Finalizar compra</Link>
          <Link href="/loja" className="mt-4 block text-center text-[0.75rem] uppercase tracking-[0.16em] text-stone hover:text-ink">Continuar comprando</Link>
        </div>
      </aside>
    </div>
  );
}
