import { Suspense } from "react";
import Link from "next/link";
import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Header, HeaderShell } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CookieConsent } from "@/components/site/cookie-consent";
import { Monogram } from "@/components/brand/logo";
import { ViewCursor } from "@/components/site/view-cursor";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { PageCurtain } from "@/components/site/page-curtain";
import { Magnetic } from "@/components/site/magnetic";
import { IconWhatsapp } from "@/components/ui/icons";
import { getSettings } from "@/lib/settings";
import { getHomeData } from "@/lib/catalog";
import { whatsappLink } from "@/lib/br";

async function HeaderWithData() {
  const [settings, home] = await Promise.all([getSettings(), getHomeData()]);
  const s = settings.store;
  return (
    <Header
      categories={home.categoryCards.map((c) => ({ slug: c.slug, name: c.name, cover: c.cover, count: c.count }))}
      whatsappHref={whatsappLink(s.whatsapp, "Olá! Vim pelo site da Nasil Vana Store.")}
      instagramHref={s.instagram ? `https://instagram.com/${s.instagram.replace(/^@/, "")}` : null}
    />
  );
}

async function Announcement() {
  const { announcement: a } = await getSettings();
  if (!a.enabled || !a.text) return null;
  const inner = <span className="eyebrow">{a.text}</span>;
  return (
    <div className="bg-ink px-4 py-2.5 text-center text-paper">
      {a.href && a.href.startsWith("/") ? <Link href={a.href} className="hover:underline">{inner}</Link> : inner}
    </div>
  );
}

async function Extras() {
  const settings = await getSettings();
  const wa = whatsappLink(settings.store.whatsapp, "Olá! Vim pelo site da Nasil Vana Store e tenho uma dúvida.");
  return (
    <>
      <CookieConsent gaId={settings.seo.ga4MeasurementId || null} />
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener"
          aria-label="Falar com a loja pelo WhatsApp"
          className="fixed bottom-4 right-4 z-30 grid h-13 w-13 place-items-center rounded-full bg-ink text-paper shadow-[0_12px_30px_-10px_rgba(0,0,0,.5)] transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
        >
          <IconWhatsapp size={24} />
        </a>
      )}
    </>
  );
}

function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      <Monogram className="h-20 w-auto sm:h-24" />
    </div>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Intro />
      <div className="film-grain" aria-hidden="true" />
      <ViewCursor />
      <Magnetic />
      <Suspense fallback={null}>
        <SmoothScroll />
        <PageCurtain />
      </Suspense>
      <Suspense fallback={null}>
        <Announcement />
      </Suspense>
      <Suspense fallback={<HeaderShell />}>
        <HeaderWithData />
      </Suspense>
      <main id="conteudo" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <Suspense fallback={<div className="mt-24 h-[640px] bg-ink" />}>
        <Footer />
      </Suspense>
      <CartDrawer />
      <Suspense fallback={null}>
        <Extras />
      </Suspense>
    </CartProvider>
  );
}
