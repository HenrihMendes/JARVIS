import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { RevealObserver } from "@/components/site/reveal-observer";

const bodoni = localFont({
  src: [
    { path: "../fonts/bodoni-moda-latin-opsz-normal.woff2", style: "normal", weight: "400 900" },
    { path: "../fonts/bodoni-moda-latin-opsz-italic.woff2", style: "italic", weight: "400 900" },
  ],
  variable: "--font-bodoni",
  display: "swap",
  fallback: ["Didot", "Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

const jost = localFont({
  src: [{ path: "../fonts/jost-latin-wght-normal.woff2", style: "normal", weight: "300 700" }],
  variable: "--font-jost",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Nasil Vana Store — Moda feminina em Sinop, MT", template: "%s · Nasil Vana Store" },
  description:
    "Moda feminina com elegância e personalidade: corsets, vestidos, conjuntos e alfaiataria. Loja em Sinop, MT, com compra online e pagamento seguro.",
  applicationName: "Nasil Vana Store",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Nasil Vana Store",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Nasil Vana Store" }],
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f6f2eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Executa antes da pintura: decide se a abertura com o monograma aparece (1× por sessão). */
const introScript = `try{var d=document.documentElement;d.classList.remove('no-js');if(sessionStorage.getItem('nv_intro')||matchMedia('(prefers-reduced-motion: reduce)').matches||/bot|lighthouse|crawler|spider/i.test(navigator.userAgent)){d.classList.add('intro-seen')}else{sessionStorage.setItem('nv_intro','1')}}catch(e){document.documentElement.classList.add('intro-seen')}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`no-js ${bodoni.variable} ${jost.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="min-h-dvh bg-paper text-ink">
        {children}
        <Suspense fallback={null}>
          <RevealObserver />
        </Suspense>
      </body>
    </html>
  );
}
