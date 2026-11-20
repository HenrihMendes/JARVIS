import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { db, schema } from "@/db";
import { settingsSchemas, type AllSettings, type SettingsKey } from "./settings-schema";

export function parseSettings(rows: { key: string; value: unknown }[]): AllSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<SettingsKey, unknown>;
  for (const key of Object.keys(settingsSchemas) as SettingsKey[]) {
    const parsed = settingsSchemas[key].safeParse(map.get(key) ?? {});
    out[key] = parsed.success ? parsed.data : settingsSchemas[key].parse({});
  }
  return out as AllSettings;
}

/** Lê as configurações (uma vez por requisição). */
export const getSettings = cache(async (): Promise<AllSettings> => {
  await connection();
  const rows = await db.select({ key: schema.settings.key, value: schema.settings.value }).from(schema.settings);
  return parseSettings(rows);
});

export function storeAddressLine(s: AllSettings["store"]): string | null {
  if (!s.addressStreet || !s.addressCity) return null;
  const parts = [
    `${s.addressStreet}${s.addressNumber ? `, ${s.addressNumber}` : ""}`,
    s.addressComplement,
    s.addressDistrict,
    `${s.addressCity} – ${s.addressState}`,
    s.addressCep ? `CEP ${s.addressCep}` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}
