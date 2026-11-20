"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Consentimento de cookies (LGPD). A loja só usa cookies essenciais por padrão.
 * O aviso só aparece se o Google Analytics estiver configurado — e o GA só carrega após "Aceitar".
 */
const KEY = "nv_consent";
type Choice = "granted" | "denied" | null;

function readChoice(): Choice {
  try {
    const m = document.cookie.match(/(?:^|; )nv_consent=(granted|denied)/);
    return (m?.[1] as Choice) ?? null;
  } catch {
    return null;
  }
}
function saveChoice(c: Exclude<Choice, null>) {
  document.cookie = `${KEY}=${c}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  window.dispatchEvent(new Event("nv-consent"));
}

export function CookieConsent({ gaId }: { gaId: string | null }) {
  const [choice, setChoice] = useState<Choice>("denied");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setChoice(readChoice());
    sync();
    setReady(true);
    const reopen = () => setChoice(null);
    window.addEventListener("nv-consent", sync);
    window.addEventListener("nv-consent-open", reopen);
    return () => {
      window.removeEventListener("nv-consent", sync);
      window.removeEventListener("nv-consent-open", reopen);
    };
  }, []);

  if (!gaId || !/^G-[A-Z0-9]{4,12}$/.test(gaId)) return null;

  return (
    <>
      {choice === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {ready && choice === null && (
        <div role="dialog" aria-label="Preferências de cookies" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl bg-paper p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,.4)] ring-1 ring-line sm:inset-x-6 sm:bottom-6">
          <p className="text-sm text-ink-2">
            Usamos cookies essenciais para o funcionamento da loja. Com a sua permissão, usamos também cookies de medição (Google Analytics) para melhorar o site.{" "}
            <a href="/politica-de-cookies" className="underline underline-offset-2">Saiba mais</a>.
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" className="btn btn-outline !min-h-11 flex-1" onClick={() => saveChoice("denied")}>
              Só essenciais
            </button>
            <button type="button" className="btn btn-primary !min-h-11 flex-1" onClick={() => saveChoice("granted")}>
              Aceitar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function CookiePrefsLink({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <button type="button" className="text-left underline underline-offset-2 hover:text-paper" onClick={() => window.dispatchEvent(new Event("nv-consent-open"))}>
      Preferências de cookies
    </button>
  );
}
