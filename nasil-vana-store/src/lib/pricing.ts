/**
 * Regras de preço — funções puras, sem acesso a banco, cobertas por testes.
 * O servidor SEMPRE recalcula tudo a partir do banco; valores vindos do navegador são ignorados.
 */
import { cepInRanges } from "./br";
import { percentOf } from "./money";

export type CouponRule = {
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotalCents: number;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
};

export type CouponResult =
  | { ok: true; discountCents: number; freeShipping: boolean; label: string }
  | { ok: false; reason: string };

export function evaluateCoupon(c: CouponRule | null | undefined, subtotalCents: number, now = new Date()): CouponResult {
  if (!c || !c.active) return { ok: false, reason: "Cupom inválido." };
  if (c.startsAt && now < c.startsAt) return { ok: false, reason: "Este cupom ainda não está válido." };
  if (c.endsAt && now > c.endsAt) return { ok: false, reason: "Este cupom expirou." };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { ok: false, reason: "Este cupom esgotou." };
  if (subtotalCents < c.minSubtotalCents) {
    return { ok: false, reason: `Válido para compras a partir de R$ ${(c.minSubtotalCents / 100).toFixed(2).replace(".", ",")}.` };
  }
  switch (c.type) {
    case "percent": {
      const d = Math.min(subtotalCents, percentOf(subtotalCents, c.value));
      return { ok: true, discountCents: d, freeShipping: false, label: `${c.value}% de desconto` };
    }
    case "fixed": {
      const d = Math.min(subtotalCents - 1, c.value); // total nunca chega a zero por cupom
      return { ok: true, discountCents: Math.max(0, d), freeShipping: false, label: "Desconto aplicado" };
    }
    case "free_shipping":
      return { ok: true, discountCents: 0, freeShipping: true, label: "Frete grátis" };
  }
}

export type ShippingRule = {
  id: string;
  name: string;
  type: "pickup" | "local_delivery" | "shipping";
  priceCents: number;
  freeAboveCents: number | null;
  cepRanges: string | null;
  eta: string | null;
  description: string | null;
  active: boolean;
};

export function availableShipping(methods: ShippingRule[], cep: string | null, subtotalCents: number, freeShippingCoupon = false) {
  return methods
    .filter((m) => m.active)
    .filter((m) => m.type === "pickup" || (cep ? cepInRanges(cep, m.cepRanges) : !m.cepRanges))
    .map((m) => {
      const free = m.type === "pickup" || freeShippingCoupon || (m.freeAboveCents != null && subtotalCents >= m.freeAboveCents);
      return { ...m, finalPriceCents: free ? 0 : m.priceCents };
    });
}

export function computeTotals(input: { subtotalCents: number; discountCents: number; shippingCents: number }) {
  const discount = Math.min(Math.max(0, input.discountCents), input.subtotalCents);
  const total = input.subtotalCents - discount + Math.max(0, input.shippingCents);
  return { subtotalCents: input.subtotalCents, discountCents: discount, shippingCents: Math.max(0, input.shippingCents), totalCents: total };
}
