"use server";

import { z } from "zod";
import { db, schema } from "@/db";
import { randomToken } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/request";
import { normalizeEmail } from "@/lib/text";

const CONSENT_TEXT = "Aceito receber novidades e ofertas da Nasil Vana Store por e-mail. Posso cancelar quando quiser.";

const input = z.object({
  email: z.string().trim().max(160).email(),
  consent: z.literal("on"),
  website: z.string().max(0).optional(), // honeypot anti-robô
});



export async function subscribeNewsletter(_: { ok: boolean; message: string } | null, form: FormData): Promise<{ ok: boolean; message: string } | null> {
  const parsed = input.safeParse({ email: form.get("email"), consent: form.get("consent"), website: form.get("website") ?? "" });
  if (!parsed.success) {
    return { ok: false, message: form.get("consent") ? "Informe um e-mail válido." : "Marque a autorização para receber e-mails." };
  }
  const rl = await rateLimit(`newsletter:${await clientIpHash()}`, 5, 600);
  if (!rl.ok) return { ok: false, message: "Muitas tentativas. Tente novamente mais tarde." };
  await db
    .insert(schema.newsletterSubscribers)
    .values({
      email: normalizeEmail(parsed.data.email),
      source: String(form.get("source") ?? "site").slice(0, 40),
      consentText: CONSENT_TEXT,
      unsubscribeToken: randomToken(18),
    })
    .onConflictDoUpdate({
      target: schema.newsletterSubscribers.email,
      set: { unsubscribedAt: null, consentAt: new Date(), consentText: CONSENT_TEXT },
    });
  // Mesma resposta para e-mail novo ou já cadastrado (não revela quem está na lista)
  return { ok: true, message: "Pronto! Você vai receber nossas novidades." };
}
