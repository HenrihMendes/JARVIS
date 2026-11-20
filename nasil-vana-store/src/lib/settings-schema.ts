import { z } from "zod";

/**
 * Configurações editáveis no painel (Configurações).
 * Nada aqui é segredo. Campos vazios = "não informado" — a loja oculta o que não foi preenchido.
 */
const opt = z.string().trim().max(500).optional().default("");

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(1).max(80).default("Nasil Vana Store"),
  tagline: opt,
  legalName: opt,
  cnpj: opt,
  email: opt,
  phone: opt,
  whatsapp: opt,
  instagram: opt,
  addressStreet: opt,
  addressNumber: opt,
  addressComplement: opt,
  addressDistrict: opt,
  addressCity: z.string().trim().max(80).default("Sinop"),
  addressState: z.string().trim().max(2).default("MT"),
  addressCep: opt,
  showAddress: z.boolean().default(false),
  openingHours: opt,
  mapsUrl: opt,
  foundedYear: opt,
});

export const commerceSettingsSchema = z.object({
  /** Nº máximo de parcelas no cartão. Vazio = não exibir parcelamento. */
  maxInstallments: z.number().int().min(1).max(12).nullable().default(null),
  /** Texto exibido junto do parcelamento, ex.: "sem juros" — só preencha se for verdade na sua conta. */
  installmentNote: opt,
  reservationMinutes: z.number().int().min(15).max(1440).default(60),
  acceptBoleto: z.boolean().default(false),
  statementDescriptor: z.string().trim().max(13).default("NASILVANA"),
  lowStockThreshold: z.number().int().min(0).max(50).default(2),
  showLowStock: z.boolean().default(true),
  requireCpf: z.boolean().default(true),
  orderNotificationEmail: opt,
  exchangeDays: z.number().int().min(7).max(90).default(7),
});

export const seoSettingsSchema = z.object({
  defaultTitle: z.string().trim().max(70).default("Nasil Vana Store — Moda feminina em Sinop, MT"),
  defaultDescription: z
    .string()
    .trim()
    .max(170)
    .default(
      "Moda feminina com elegância e personalidade: corsets, vestidos, conjuntos e alfaiataria. Loja em Sinop, MT, com compra online e pagamento seguro.",
    ),
  googleSiteVerification: opt,
  ga4MeasurementId: opt,
  merchantFeedEnabled: z.boolean().default(true),
});

export const announcementSchema = z.object({
  enabled: z.boolean().default(false),
  text: opt,
  href: opt,
});

export const settingsSchemas = {
  store: storeSettingsSchema,
  commerce: commerceSettingsSchema,
  seo: seoSettingsSchema,
  announcement: announcementSchema,
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type StoreSettings = z.infer<typeof storeSettingsSchema>;
export type CommerceSettings = z.infer<typeof commerceSettingsSchema>;
export type SeoSettings = z.infer<typeof seoSettingsSchema>;
export type AnnouncementSettings = z.infer<typeof announcementSchema>;
export type AllSettings = {
  store: StoreSettings;
  commerce: CommerceSettings;
  seo: SeoSettings;
  announcement: AnnouncementSettings;
};
