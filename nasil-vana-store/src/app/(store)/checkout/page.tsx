import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getSettings } from "@/lib/settings";
import { paymentsConfigured } from "@/lib/env";
import { whatsappLink } from "@/lib/br";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

async function Content() {
  const settings = await getSettings();
  return (
    <CheckoutForm
      requireCpf={settings.commerce.requireCpf}
      paymentsReady={paymentsConfigured}
      acceptBoleto={settings.commerce.acceptBoleto}
      whatsappHref={whatsappLink(settings.store.whatsapp, "Olá! Quero finalizar uma compra pelo site.")}
    />
  );
}

export default function CheckoutPage() {
  return (
    <>
      <header className="mx-auto max-w-[1400px] px-[var(--gutter)] pb-10 pt-10 sm:pt-14">
        <p className="eyebrow text-stone">Compra segura</p>
        <h1 className="display mt-3 text-[clamp(2.8rem,6vw,5rem)]">
          Finalizar <em>compra</em>
        </h1>
      </header>
      <Suspense fallback={<div className="mx-auto h-[60vh] max-w-[1400px] px-[var(--gutter)]"><div className="skeleton h-full" /></div>}>
        <Content />
      </Suspense>
    </>
  );
}
