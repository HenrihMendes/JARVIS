"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { addItem, findCartId, getOrCreateCartId, loadCart, setQuantity, EMPTY_CART, type CartSnapshot } from "@/lib/cart";
import { evaluateCoupon } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/request";

export type CartResult = { cart: CartSnapshot; ok: boolean; message?: string };

const uuid = z.string().uuid();
const qty = z.number().int().min(0).max(20);

async function limited(bucket: string, limit: number) {
  const r = await rateLimit(`${bucket}:${await clientIpHash()}`, limit, 60);
  return !r.ok;
}

export async function getCartAction(): Promise<CartSnapshot> {
  return loadCart(await findCartId());
}

export async function addToCartAction(variantId: string, quantity = 1): Promise<CartResult> {
  const v = uuid.safeParse(variantId);
  const q = qty.min(1).safeParse(quantity);
  if (!v.success || !q.success) return { cart: await getCartAction(), ok: false, message: "Seleção inválida." };
  if (await limited("cart", 60)) return { cart: await getCartAction(), ok: false, message: "Muitas tentativas. Aguarde um instante." };
  const cartId = await getOrCreateCartId();
  const r = await addItem(cartId, v.data, q.data);
  return { cart: await loadCart(cartId), ok: r.ok, message: r.message };
}

export async function updateQuantityAction(variantId: string, quantity: number): Promise<CartResult> {
  const v = uuid.safeParse(variantId);
  const q = qty.safeParse(quantity);
  const cartId = await findCartId();
  if (!v.success || !q.success || !cartId) return { cart: await loadCart(cartId), ok: false, message: "Seleção inválida." };
  if (await limited("cart", 60)) return { cart: await loadCart(cartId), ok: false, message: "Muitas tentativas. Aguarde um instante." };
  const r = await setQuantity(cartId, v.data, q.data);
  return { cart: await loadCart(cartId), ok: r.ok, message: r.message };
}

export async function removeFromCartAction(variantId: string): Promise<CartResult> {
  return updateQuantityAction(variantId, 0);
}

export async function applyCouponAction(code: string): Promise<CartResult> {
  const cartId = await findCartId();
  if (!cartId) return { cart: EMPTY_CART, ok: false, message: "Seu carrinho está vazio." };
  if (await limited("coupon", 10)) return { cart: await loadCart(cartId), ok: false, message: "Muitas tentativas. Aguarde um minuto." };
  const normalized = code.trim().toUpperCase().slice(0, 40);
  if (!/^[A-Z0-9_-]{2,40}$/.test(normalized)) return { cart: await loadCart(cartId), ok: false, message: "Cupom inválido." };
  const [c] = await db.select().from(schema.coupons).where(eq(schema.coupons.code, normalized)).limit(1);
  const cart = await loadCart(cartId);
  const result = evaluateCoupon(c ?? null, cart.subtotalCents);
  if (!result.ok) return { cart, ok: false, message: result.reason };
  await db.update(schema.carts).set({ couponCode: normalized }).where(eq(schema.carts.id, cartId));
  return { cart: await loadCart(cartId), ok: true, message: result.label };
}

export async function removeCouponAction(): Promise<CartResult> {
  const cartId = await findCartId();
  if (cartId) await db.update(schema.carts).set({ couponCode: null }).where(eq(schema.carts.id, cartId));
  return { cart: await loadCart(cartId), ok: true };
}
