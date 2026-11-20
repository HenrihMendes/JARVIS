import { describe, expect, it } from "vitest";
import { availableShipping, computeTotals, evaluateCoupon, type CouponRule, type ShippingRule } from "@/lib/pricing";

const coupon = (o: Partial<CouponRule> = {}): CouponRule => ({
  code: "X", type: "percent", value: 10, minSubtotalCents: 0, startsAt: null, endsAt: null, maxUses: null, usedCount: 0, active: true, ...o,
});

describe("cupons", () => {
  it("aplica percentual arredondando para baixo", () => {
    const r = evaluateCoupon(coupon({ value: 15 }), 39990);
    expect(r).toMatchObject({ ok: true, discountCents: 5998 });
  });
  it("valor fixo nunca zera o pedido", () => {
    const r = evaluateCoupon(coupon({ type: "fixed", value: 50000 }), 12000);
    expect(r.ok && r.discountCents).toBe(11999);
  });
  it("respeita mínimo, validade, limite e status", () => {
    expect(evaluateCoupon(coupon({ minSubtotalCents: 20000 }), 12000).ok).toBe(false);
    expect(evaluateCoupon(coupon({ endsAt: new Date("2020-01-01") }), 12000).ok).toBe(false);
    expect(evaluateCoupon(coupon({ startsAt: new Date("2999-01-01") }), 12000).ok).toBe(false);
    expect(evaluateCoupon(coupon({ maxUses: 3, usedCount: 3 }), 12000).ok).toBe(false);
    expect(evaluateCoupon(coupon({ active: false }), 12000).ok).toBe(false);
    expect(evaluateCoupon(null, 12000).ok).toBe(false);
  });
  it("frete grátis não dá desconto em produto", () => {
    expect(evaluateCoupon(coupon({ type: "free_shipping" }), 12000)).toMatchObject({ ok: true, discountCents: 0, freeShipping: true });
  });
});

const rule = (o: Partial<ShippingRule>): ShippingRule => ({
  id: "1", name: "x", type: "local_delivery", priceCents: 1500, freeAboveCents: null, cepRanges: null, eta: null, description: null, active: true, ...o,
});

describe("frete", () => {
  const methods = [
    rule({ id: "pick", type: "pickup", priceCents: 999 }),
    rule({ id: "sinop", cepRanges: "78550000-78559999" }),
    rule({ id: "brasil", type: "shipping", priceCents: 3500, freeAboveCents: 50000 }),
    rule({ id: "off", active: false }),
  ];
  it("filtra por faixa de CEP e ignora inativos", () => {
    expect(availableShipping(methods, "78550200", 10000).map((m) => m.id)).toEqual(["pick", "sinop", "brasil"]);
    expect(availableShipping(methods, "01310100", 10000).map((m) => m.id)).toEqual(["pick", "brasil"]);
  });
  it("retirada é sempre grátis; frete grátis acima do limite e por cupom", () => {
    const a = availableShipping(methods, "01310100", 60000);
    expect(a.find((m) => m.id === "pick")!.finalPriceCents).toBe(0);
    expect(a.find((m) => m.id === "brasil")!.finalPriceCents).toBe(0);
    expect(availableShipping(methods, "78550200", 1000, true).find((m) => m.id === "sinop")!.finalPriceCents).toBe(0);
  });
});

describe("totais", () => {
  it("total = subtotal − desconto + frete e desconto nunca excede subtotal", () => {
    expect(computeTotals({ subtotalCents: 10000, discountCents: 1000, shippingCents: 1500 }).totalCents).toBe(10500);
    expect(computeTotals({ subtotalCents: 10000, discountCents: 99999, shippingCents: 0 }).discountCents).toBe(10000);
  });
});
