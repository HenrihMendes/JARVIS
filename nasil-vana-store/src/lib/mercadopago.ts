import "server-only";
import { createHmac } from "node:crypto";
import { env } from "./env";
import { safeEqual } from "./crypto";
import { decimalToCents } from "./money";

/**
 * Integração Mercado Pago — Checkout Pro (pagamento no ambiente do Mercado Pago).
 *
 * Por que Checkout Pro (redirecionamento) e não formulário de cartão no site:
 * - Os dados do cartão nunca passam pelo nosso servidor nem pelo navegador no nosso domínio,
 *   o que tira a loja do escopo mais pesado do PCI-DSS.
 * - Pix, cartão (com parcelamento) e saldo Mercado Pago sem código extra.
 * - Antifraude e 3-D Secure do próprio Mercado Pago.
 *
 * Referências usadas (SDK oficial mercadopago@3.6.2, endpoints REST):
 *   POST /checkout/preferences · GET /v1/payments/{id} · POST /v1/payments/{id}/refunds
 *   Webhook: header x-signature "ts=...,v1=..." + x-request-id; manifest "id:{data.id};request-id:{x-request-id};ts:{ts};"
 */

export class MercadoPagoError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

function token() {
  if (!env.MP_ACCESS_TOKEN) throw new MercadoPagoError("Mercado Pago não configurado (MP_ACCESS_TOKEN ausente).");
  return env.MP_ACCESS_TOKEN;
}

async function mp<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const res = await fetch(`${env.MP_API_BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token()}`,
      "content-type": "application/json",
      ...(init.idempotencyKey ? { "x-idempotency-key": init.idempotencyKey } : {}),
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    // Nunca logar o token; o corpo de erro do MP não contém dados de cartão.
    throw new MercadoPagoError(`Mercado Pago respondeu ${res.status} em ${path}`, res.status, body);
  }
  return body as T;
}

/* ------------------------------- Preferência ------------------------------- */

export type PreferenceInput = {
  orderId: string;
  orderNumber: number;
  publicToken: string;
  items: { id: string; title: string; quantity: number; unitPriceCents: number; pictureUrl?: string }[];
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  payer: { name: string; email: string; phone: string; cpf?: string | null; cep?: string | null; street?: string | null; number?: string | null };
  expiresAt: Date;
  maxInstallments: number | null;
  acceptBoleto: boolean;
  statementDescriptor: string;
};

export type PreferenceResponse = { id: string; init_point: string; sandbox_init_point?: string };

const cents = (c: number) => Math.round(c) / 100;

export function buildPreference(input: PreferenceInput) {
  const site = env.SITE_URL.replace(/\/$/, "");
  const https = site.startsWith("https://");
  const back = (status: string) => `${site}/pedido/${input.publicToken}?retorno=${status}`;
  const [first, ...rest] = input.payer.name.trim().split(/\s+/);
  const phoneDigits = input.payer.phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");

  // Sem desconto: itens detalhados + frete como item. Com desconto: um item consolidado
  // com o valor exato do pedido (evita arredondamentos ao distribuir o desconto).
  const items =
    input.discountCents > 0
      ? [
          {
            id: `pedido-${input.orderNumber}`,
            title: `Pedido #${input.orderNumber} — Nasil Vana Store`,
            description: input.items.map((i) => `${i.quantity}× ${i.title}`).join(", ").slice(0, 250),
            quantity: 1,
            currency_id: "BRL",
            unit_price: cents(input.totalCents),
          },
        ]
      : [
          ...input.items.map((i) => ({
            id: i.id,
            title: i.title.slice(0, 250),
            quantity: i.quantity,
            currency_id: "BRL",
            unit_price: cents(i.unitPriceCents),
            ...(i.pictureUrl ? { picture_url: i.pictureUrl } : {}),
            category_id: "fashion",
          })),
          ...(input.shippingCents > 0
            ? [{ id: "frete", title: "Frete", quantity: 1, currency_id: "BRL", unit_price: cents(input.shippingCents) }]
            : []),
        ];

  const sum = items.reduce((n, i) => n + Math.round(i.unit_price * 100) * i.quantity, 0);
  if (sum !== input.totalCents) throw new MercadoPagoError(`Soma dos itens (${sum}) difere do total (${input.totalCents}).`);

  const expires = input.expiresAt.toISOString().replace("Z", "-00:00");
  return {
    items,
    external_reference: input.orderId,
    metadata: { order_number: input.orderNumber },
    payer: {
      name: first,
      surname: rest.join(" ") || undefined,
      email: input.payer.email,
      ...(phoneDigits.length >= 10 ? { phone: { area_code: phoneDigits.slice(0, 2), number: phoneDigits.slice(2) } } : {}),
      ...(input.payer.cpf ? { identification: { type: "CPF", number: input.payer.cpf.replace(/\D/g, "") } } : {}),
      ...(input.payer.cep
        ? { address: { zip_code: input.payer.cep.replace(/\D/g, ""), street_name: input.payer.street ?? undefined, street_number: input.payer.number ?? undefined } }
        : {}),
    },
    payment_methods: {
      excluded_payment_types: input.acceptBoleto ? [] : [{ id: "ticket" }],
      ...(input.maxInstallments ? { installments: input.maxInstallments } : {}),
    },
    back_urls: { success: back("aprovado"), pending: back("pendente"), failure: back("falhou") },
    // auto_return exige back_urls HTTPS
    ...(https ? { auto_return: "approved" } : {}),
    ...(https ? { notification_url: `${site}/api/webhooks/mercadopago?source_news=webhooks` } : {}),
    expires: true,
    expiration_date_from: new Date().toISOString().replace("Z", "-00:00"),
    expiration_date_to: expires,
    date_of_expiration: expires,
    statement_descriptor: input.statementDescriptor.slice(0, 13) || undefined,
    binary_mode: false,
  };
}

export async function createPreference(input: PreferenceInput): Promise<PreferenceResponse> {
  return mp<PreferenceResponse>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(buildPreference(input)),
    idempotencyKey: `pref-${input.orderId}`,
  });
}

/* --------------------------------- Pagamento --------------------------------- */

export type MPPayment = {
  id: number | string;
  status: string;
  status_detail?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  transaction_amount_refunded?: number;
  currency_id?: string;
  payment_type_id?: string;
  payment_method_id?: string;
  installments?: number;
  date_last_updated?: string;
  date_approved?: string | null;
  live_mode?: boolean;
};

export async function getPayment(id: string): Promise<MPPayment> {
  if (!/^\d{1,20}$/.test(id)) throw new MercadoPagoError("ID de pagamento inválido");
  return mp<MPPayment>(`/v1/payments/${id}`, { method: "GET" });
}

export async function refundPayment(id: string, amountCents?: number) {
  if (!/^\d{1,20}$/.test(id)) throw new MercadoPagoError("ID de pagamento inválido");
  return mp<{ id: number; amount: number; status: string }>(`/v1/payments/${id}/refunds`, {
    method: "POST",
    body: JSON.stringify(amountCents ? { amount: cents(amountCents) } : {}),
    idempotencyKey: `refund-${id}-${amountCents ?? "total"}`,
  });
}

export async function cancelPayment(id: string) {
  if (!/^\d{1,20}$/.test(id)) throw new MercadoPagoError("ID de pagamento inválido");
  return mp<MPPayment>(`/v1/payments/${id}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
}

/** Converte status do MP para o enum interno. */
export function mapPaymentStatus(s: string) {
  const known = ["pending", "in_process", "approved", "authorized", "rejected", "cancelled", "refunded", "charged_back", "in_mediation"] as const;
  return (known as readonly string[]).includes(s) ? (s as (typeof known)[number]) : "pending";
}

export const amountCents = (p: MPPayment) => decimalToCents(p.transaction_amount ?? 0);

/* ------------------------- Assinatura do webhook ------------------------- */

export type SignatureCheck = { ok: true } | { ok: false; reason: string };

/**
 * Valida o header x-signature (HMAC-SHA256 com a "assinatura secreta" do painel do MP).
 * Implementação equivalente ao WebhookSignatureValidator do SDK oficial:
 *  - manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};" (pares ausentes são omitidos)
 *  - data.id alfanumérico deve ir em minúsculas
 *  - comparação em tempo constante
 */
export function verifyWebhookSignature(args: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
  toleranceSeconds?: number;
  now?: number;
}): SignatureCheck {
  const header = args.xSignature?.trim();
  if (!header) return { ok: false, reason: "missing-signature" };
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim().toLowerCase();
    const v = part.slice(eq + 1).trim();
    if (k === "ts") ts = v;
    else if (k === "v1") v1 = v;
  }
  if (!ts || !/^\d+$/.test(ts)) return { ok: false, reason: "missing-ts" };
  if (!v1 || !/^[0-9a-f]{64}$/i.test(v1)) return { ok: false, reason: "missing-hash" };

  const parts: string[] = [];
  const dataId = args.dataId?.trim();
  if (dataId) parts.push(`id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId}`);
  const reqId = args.xRequestId?.trim();
  if (reqId) parts.push(`request-id:${reqId}`);
  parts.push(`ts:${ts}`);
  const manifest = `${parts.join(";")};`;
  const expected = createHmac("sha256", args.secret).update(manifest).digest("hex");
  if (!safeEqual(expected, v1.toLowerCase())) return { ok: false, reason: "mismatch" };

  if (args.toleranceSeconds && args.toleranceSeconds > 0) {
    const n = Number(ts);
    const tsMs = n > 1e12 ? n : n * 1000; // aceita segundos ou milissegundos
    const drift = Math.abs((args.now ?? Date.now()) - tsMs) / 1000;
    if (drift > args.toleranceSeconds) return { ok: false, reason: "stale" };
  }
  return { ok: true };
}
