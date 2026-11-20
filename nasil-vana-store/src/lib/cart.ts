import "server-only";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { randomToken, sha256 } from "./crypto";
import { isProd } from "./env";
import { evaluateCoupon, type CouponResult } from "./pricing";
import type { MediaLike } from "./media-url";

export const CART_COOKIE = isProd ? "__Host-nv_cart" : "nv_cart";
const CART_MAX_AGE = 60 * 60 * 24 * 30;
export const MAX_QTY_PER_LINE = 10;

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string;
  colorName: string | null;
  sizeLabel: string | null;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  stock: number;
  lineTotalCents: number;
  image: MediaLike | null;
  /** Problema detectado ao revalidar (ex.: estoque diminuiu) */
  notice: string | null;
};

export type CartSnapshot = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  couponCode: string | null;
  coupon: CouponResult | null;
  notices: string[];
};

export const EMPTY_CART: CartSnapshot = { lines: [], count: 0, subtotalCents: 0, couponCode: null, coupon: null, notices: [] };

async function readToken() {
  const t = (await cookies()).get(CART_COOKIE)?.value;
  return t && t.length <= 100 ? t : null;
}

export async function findCartId(): Promise<string | null> {
  const token = await readToken();
  if (!token) return null;
  const [row] = await db.select({ id: schema.carts.id }).from(schema.carts).where(eq(schema.carts.tokenHash, sha256(token))).limit(1);
  return row?.id ?? null;
}

/** Cria o carrinho só quando a cliente adiciona algo (não gera lixo no banco por visita). */
export async function getOrCreateCartId(): Promise<string> {
  const existing = await findCartId();
  if (existing) return existing;
  const token = randomToken(24);
  const [row] = await db.insert(schema.carts).values({ tokenHash: sha256(token) }).returning({ id: schema.carts.id });
  (await cookies()).set(CART_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
  return row.id;
}

export function variantLabel(color: string | null | undefined, size: string | null | undefined) {
  return [color, size ? `Tam. ${size}` : null].filter(Boolean).join(" · ");
}

/**
 * Lê e REVALIDA o carrinho contra o banco: preço atual, estoque atual, produto ativo.
 * Ajusta quantidades acima do estoque e remove itens indisponíveis, avisando a cliente.
 */
export async function loadCart(cartId: string | null): Promise<CartSnapshot> {
  if (!cartId) return EMPTY_CART;
  const [cart] = await db.select().from(schema.carts).where(eq(schema.carts.id, cartId)).limit(1);
  if (!cart) return EMPTY_CART;

  const items = await db.query.cartItems.findMany({
    where: eq(schema.cartItems.cartId, cartId),
    orderBy: (t, { asc }) => [asc(t.addedAt)],
    with: {
      variant: {
        with: {
          color: true,
          size: true,
          product: { with: { images: { orderBy: (t, { asc }) => [asc(t.sortOrder)], with: { media: true } } } },
        },
      },
    },
  });

  const notices: string[] = [];
  const lines: CartLine[] = [];
  for (const it of items) {
    const v = it.variant;
    const p = v.product;
    const unavailable = !v.active || p.status !== "active" || p.priceCents == null;
    if (unavailable || v.stock <= 0) {
      notices.push(`${p.name} (${variantLabel(v.color?.name, v.size?.label) || "peça"}) não está mais disponível e foi removida.`);
      await db.delete(schema.cartItems).where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.variantId, v.id)));
      continue;
    }
    let qty = it.quantity;
    let notice: string | null = null;
    if (qty > v.stock) {
      qty = v.stock;
      notice = `Restam ${v.stock} unidade${v.stock > 1 ? "s" : ""}. Ajustamos a quantidade.`;
      await db
        .update(schema.cartItems)
        .set({ quantity: qty })
        .where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.variantId, v.id)));
    }
    const unit = v.priceCents ?? p.priceCents!;
    const img = p.images.find((i) => i.colorId && i.colorId === v.colorId) ?? p.images[0];
    lines.push({
      variantId: v.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      variantLabel: variantLabel(v.color?.name, v.size?.label),
      colorName: v.color?.name ?? null,
      sizeLabel: v.size?.label ?? null,
      sku: v.sku,
      unitPriceCents: unit,
      quantity: qty,
      stock: v.stock,
      lineTotalCents: unit * qty,
      image: img
        ? { key: img.media.key, width: img.media.width, height: img.media.height, widths: img.media.widths, blurDataUrl: img.media.blurDataUrl, alt: img.media.alt, focalY: img.media.focalY }
        : null,
      notice,
    });
  }

  const subtotalCents = lines.reduce((n, l) => n + l.lineTotalCents, 0);
  let coupon: CouponResult | null = null;
  if (cart.couponCode) {
    const [c] = await db.select().from(schema.coupons).where(eq(schema.coupons.code, cart.couponCode)).limit(1);
    coupon = evaluateCoupon(c ?? null, subtotalCents);
  }
  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents,
    couponCode: cart.couponCode,
    coupon,
    notices,
  };
}

export async function addItem(cartId: string, variantId: string, quantity: number): Promise<{ ok: boolean; message?: string }> {
  const v = await db.query.productVariants.findFirst({
    where: eq(schema.productVariants.id, variantId),
    with: { product: { columns: { status: true, priceCents: true } } },
  });
  if (!v || !v.active || v.product.status !== "active" || v.product.priceCents == null) {
    return { ok: false, message: "Esta peça não está disponível." };
  }
  if (v.stock <= 0) return { ok: false, message: "Esta peça esgotou." };
  const [current] = await db
    .select({ q: schema.cartItems.quantity })
    .from(schema.cartItems)
    .where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.variantId, variantId)));
  const wanted = Math.min((current?.q ?? 0) + quantity, v.stock, MAX_QTY_PER_LINE);
  if (current && wanted === current.q) {
    return { ok: false, message: v.stock <= current.q ? `Você já tem todas as ${v.stock} unidade(s) disponíveis no carrinho.` : "Quantidade máxima atingida." };
  }
  await db
    .insert(schema.cartItems)
    .values({ cartId, variantId, quantity: wanted })
    .onConflictDoUpdate({ target: [schema.cartItems.cartId, schema.cartItems.variantId], set: { quantity: wanted } });
  await db.update(schema.carts).set({ updatedAt: sql`now()` }).where(eq(schema.carts.id, cartId));
  return { ok: true };
}

export async function setQuantity(cartId: string, variantId: string, quantity: number) {
  if (quantity <= 0) {
    await db.delete(schema.cartItems).where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.variantId, variantId)));
    return { ok: true };
  }
  const [v] = await db.select({ stock: schema.productVariants.stock }).from(schema.productVariants).where(eq(schema.productVariants.id, variantId));
  if (!v) return { ok: false, message: "Peça não encontrada." };
  const q = Math.min(quantity, v.stock, MAX_QTY_PER_LINE);
  if (q <= 0) {
    await db.delete(schema.cartItems).where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.variantId, variantId)));
    return { ok: false, message: "Esta peça esgotou." };
  }
  await db
    .update(schema.cartItems)
    .set({ quantity: q })
    .where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.variantId, variantId)));
  return q < quantity ? { ok: false, message: `Só temos ${q} unidade${q > 1 ? "s" : ""} disponíve${q > 1 ? "is" : "l"}.` } : { ok: true };
}

export async function clearCart(cartId: string) {
  await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cartId));
  await db.update(schema.carts).set({ couponCode: null }).where(eq(schema.carts.id, cartId));
}
