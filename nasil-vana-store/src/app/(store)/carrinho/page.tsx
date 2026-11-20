import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page";

export const metadata: Metadata = { title: "Sacola", robots: { index: false, follow: true } };

export default function CarrinhoPage() {
  return (
    <>
      <header className="mx-auto max-w-[1400px] px-[var(--gutter)] pb-6 pt-10 sm:pt-14">
        <h1 className="display text-[clamp(2.8rem,6vw,5rem)]">
          Sua <em>sacola</em>
        </h1>
      </header>
      <CartPageClient />
    </>
  );
}
