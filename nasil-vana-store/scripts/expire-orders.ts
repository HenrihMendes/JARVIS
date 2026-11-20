/** Alternativa à rota de cron: rode via crontab do servidor a cada 5 minutos. */
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { createDb } from "../src/db/client";
import * as s from "../src/db/schema";

(async () => {
  const { db, sql: conn } = createDb();
  const stale = await db
    .select({ id: s.orders.id })
    .from(s.orders)
    .where(and(eq(s.orders.status, "pending_payment"), lt(s.orders.expiresAt, new Date()), inArray(s.orders.paymentStatus, ["none", "pending", "rejected", "cancelled"])));
  for (const { id } of stale) {
    await db.transaction(async (tx) => {
      const [o] = await tx.select().from(s.orders).where(eq(s.orders.id, id)).for("update");
      if (o?.status !== "pending_payment") return;
      if (o.stockReserved) {
        const items = await tx.select().from(s.orderItems).where(eq(s.orderItems.orderId, id));
        for (const it of items) if (it.variantId) await tx.update(s.productVariants).set({ stock: sql`${s.productVariants.stock} + ${it.quantity}` }).where(eq(s.productVariants.id, it.variantId));
      }
      if (o.couponCounted && o.couponId) await tx.update(s.coupons).set({ usedCount: sql`GREATEST(${s.coupons.usedCount} - 1, 0)` }).where(eq(s.coupons.id, o.couponId));
      await tx.update(s.orders).set({ status: "expired", stockReserved: false, couponCounted: false, cancelledAt: new Date() }).where(eq(s.orders.id, id));
      await tx.insert(s.orderEvents).values({ orderId: id, type: "status", message: "Expirado: pagamento não confirmado dentro do prazo de reserva. Estoque devolvido." });
    });
  }
  console.log(`${stale.length} pedido(s) expirado(s)`);
  await conn.end();
})();
