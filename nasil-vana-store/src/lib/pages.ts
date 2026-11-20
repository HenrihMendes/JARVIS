import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { storeAddressLine } from "./settings";
import type { AllSettings } from "./settings-schema";
import type { Vars } from "./markdown";

export const getPage = cache(async (slug: string) => {
  await connection();
  const [p] = await db
    .select()
    .from(schema.pages)
    .where(and(eq(schema.pages.slug, slug), eq(schema.pages.published, true)))
    .limit(1);
  return p ?? null;
});

export const getFaqs = cache(async () => {
  await connection();
  return db.select().from(schema.faqs).where(eq(schema.faqs.active, true)).orderBy(asc(schema.faqs.sortOrder));
});

export function pageVars(s: AllSettings): Vars {
  const st = s.store;
  return {
    "loja.nome": st.name,
    "loja.razaoSocial": st.legalName,
    "loja.cnpj": st.cnpj,
    "loja.endereco": storeAddressLine(st),
    "loja.email": st.email,
    "loja.whatsapp": st.whatsapp,
    "loja.telefone": st.phone,
    "loja.cidade": st.addressCity,
    "loja.uf": st.addressState,
    "comercio.prazoTroca": String(s.commerce.exchangeDays),
  };
}
