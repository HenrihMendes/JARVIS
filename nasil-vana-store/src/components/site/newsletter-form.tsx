"use client";

import { useActionState, useId } from "react";
import { subscribeNewsletter } from "@/app/actions/newsletter";

type NewsletterState = { ok: boolean; message: string } | null;
import { IconArrow } from "@/components/ui/icons";

export function NewsletterForm({ tone = "light", source = "rodape" }: { tone?: "light" | "dark"; source?: string }) {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeNewsletter, null);
  const id = useId();
  const dark = tone === "dark";
  if (state?.ok) {
    return (
      <p role="status" className={`serif text-xl ${dark ? "text-paper" : ""}`}>
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="w-full" noValidate>
      <input type="hidden" name="source" value={source} />
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Não preencha <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label htmlFor={`${id}-email`} className="sr-only">
        Seu e-mail
      </label>
      <div className={`flex items-end gap-3 border-b ${dark ? "border-paper/50 focus-within:border-paper" : "border-ink/40 focus-within:border-ink"} transition-colors`}>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="seu@email.com"
          className={`min-h-12 w-full bg-transparent py-2 text-base focus:outline-none ${dark ? "text-paper placeholder:text-paper/50" : "placeholder:text-mist"}`}
        />
        <button type="submit" disabled={pending} className="mb-1 grid h-11 w-11 shrink-0 place-items-center disabled:opacity-40" aria-label="Assinar">
          <IconArrow size={22} />
        </button>
      </div>
      <label className={`mt-4 flex cursor-pointer items-start gap-3 text-[0.8125rem] leading-snug ${dark ? "text-paper/75" : "text-stone"}`}>
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-suede)]" />
        <span>
          Aceito receber novidades e ofertas por e-mail. Posso cancelar quando quiser. Veja a{" "}
          <a href="/politica-de-privacidade" className="underline underline-offset-2">
            política de privacidade
          </a>
          .
        </span>
      </label>
      {state && !state.ok && (
        <p role="alert" className={`mt-3 text-sm ${dark ? "text-[#f3b4a8]" : "text-danger"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
