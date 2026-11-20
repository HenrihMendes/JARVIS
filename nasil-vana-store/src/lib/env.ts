import { z } from "zod";

/**
 * Variáveis de ambiente validadas na inicialização.
 * Segredos ficam APENAS em variáveis de ambiente — nunca no código ou no banco.
 */
const bool = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  DATABASE_SSL: bool,
  DATABASE_PREPARE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),

  /** URL pública do site, sem barra final. Ex.: https://www.nasilvanastore.com.br */
  SITE_URL: z.string().url().default("http://localhost:3000"),

  /** Segredo para HMAC interno (hash de IP, tokens). Mínimo 32 caracteres. */
  APP_SECRET: z.string().min(32, "APP_SECRET deve ter pelo menos 32 caracteres"),

  /* Mercado Pago */
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  MP_API_BASE: z.string().url().default("https://api.mercadopago.com"),
  /** Tolerância (s) do timestamp da assinatura do webhook. 0 = desativado. */
  MP_WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().min(0).default(0),

  /* Armazenamento de imagens */
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./storage"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** URL pública do bucket/CDN (ex.: https://cdn.seudominio.com.br) */
  S3_PUBLIC_URL: z.string().url().optional(),

  /* E-mail transacional (opcional) */
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  /* Tarefas agendadas */
  CRON_SECRET: z.string().min(24).optional(),

  /* CEP */
  VIACEP_BASE: z.string().url().default("https://viacep.com.br/ws"),
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Configuração inválida de ambiente:\n${issues}\nVeja .env.example`);
  }
  const e = parsed.data;
  if (e.NODE_ENV === "production" && e.SITE_URL.startsWith("http://") && !e.SITE_URL.includes("localhost")) {
    throw new Error("SITE_URL deve usar HTTPS em produção.");
  }
  return e;
}

export const env = load();

export const isProd = env.NODE_ENV === "production";
export const paymentsConfigured = Boolean(env.MP_ACCESS_TOKEN);
export const webhookSecretConfigured = Boolean(env.MP_WEBHOOK_SECRET);
