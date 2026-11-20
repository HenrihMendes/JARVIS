import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { buildPreference, verifyWebhookSignature } from "@/lib/mercadopago";

const SECRET = "segredo-de-teste";
const sign = (id: string, req: string, ts: string, secret = SECRET) => createHmac("sha256", secret).update(`id:${id};request-id:${req};ts:${ts};`).digest("hex");

describe("assinatura de webhook", () => {
  it("aceita assinatura válida", () => {
    const ts = "1742505638";
    expect(verifyWebhookSignature({ xSignature: `ts=${ts},v1=${sign("123", "req-1", ts)}`, xRequestId: "req-1", dataId: "123", secret: SECRET })).toEqual({ ok: true });
  });
  it("recusa segredo errado, dados trocados e cabeçalho ausente", () => {
    const ts = "1742505638";
    expect(verifyWebhookSignature({ xSignature: `ts=${ts},v1=${sign("123", "req-1", ts, "outro")}`, xRequestId: "req-1", dataId: "123", secret: SECRET }).ok).toBe(false);
    expect(verifyWebhookSignature({ xSignature: `ts=${ts},v1=${sign("123", "req-1", ts)}`, xRequestId: "req-1", dataId: "999", secret: SECRET }).ok).toBe(false);
    expect(verifyWebhookSignature({ xSignature: null, xRequestId: "req-1", dataId: "123", secret: SECRET }).ok).toBe(false);
    expect(verifyWebhookSignature({ xSignature: "lixo", xRequestId: "req-1", dataId: "123", secret: SECRET }).ok).toBe(false);
  });
  it("id alfanumérico é comparado em minúsculas (regra da documentação)", () => {
    const ts = "1742505638";
    expect(verifyWebhookSignature({ xSignature: `ts=${ts},v1=${sign("abc123", "r", ts)}`, xRequestId: "r", dataId: "ABC123", secret: SECRET }).ok).toBe(true);
  });
  it("tolerância de tempo opcional (segundos ou milissegundos)", () => {
    const now = Date.now();
    const old = String(Math.floor(now / 1000) - 3600);
    expect(verifyWebhookSignature({ xSignature: `ts=${old},v1=${sign("1", "r", old)}`, xRequestId: "r", dataId: "1", secret: SECRET, toleranceSeconds: 300, now }).ok).toBe(false);
    const fresh = String(now);
    expect(verifyWebhookSignature({ xSignature: `ts=${fresh},v1=${sign("1", "r", fresh)}`, xRequestId: "r", dataId: "1", secret: SECRET, toleranceSeconds: 300, now }).ok).toBe(true);
  });
});

describe("preferência do Checkout Pro", () => {
  const base = {
    orderId: "0b5c2f6e-1111-4c4c-9999-123456789abc",
    orderNumber: 1001,
    publicToken: "tok",
    items: [{ id: "SKU1", title: "Vestido", quantity: 1, unitPriceCents: 39990 }],
    shippingCents: 1500,
    discountCents: 0,
    totalCents: 41490,
    payer: { name: "Maria da Silva", email: "m@x.com", phone: "66999990000", cpf: "529.982.247-25" },
    expiresAt: new Date("2030-01-01T12:00:00Z"),
    maxInstallments: 3,
    acceptBoleto: false,
    statementDescriptor: "NASILVANA",
  };
  it("soma dos itens bate com o total e inclui frete", () => {
    const p = buildPreference(base);
    expect(p.items.reduce((n, i) => n + Math.round(i.unit_price * 100) * i.quantity, 0)).toBe(41490);
    expect(p.external_reference).toBe(base.orderId);
    expect(p.payment_methods.excluded_payment_types).toEqual([{ id: "ticket" }]);
    expect(p.auto_return).toBe("approved");
    expect(p.notification_url).toBe("https://www.exemplo.com.br/api/webhooks/mercadopago?source_news=webhooks");
    expect(p.payer.identification).toEqual({ type: "CPF", number: "52998224725" });
  });
  it("com desconto envia item consolidado com o valor exato", () => {
    const p = buildPreference({ ...base, discountCents: 3999, totalCents: 41490 - 3999 });
    expect(p.items).toHaveLength(1);
    expect(Math.round(p.items[0].unit_price * 100)).toBe(37491);
  });
  it("recusa preferência inconsistente", () => {
    expect(() => buildPreference({ ...base, totalCents: 100 })).toThrow();
  });
});
