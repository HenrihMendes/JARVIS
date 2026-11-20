import "server-only";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Rate limit de janela fixa, persistido no Postgres — funciona com várias instâncias
 * e em ambiente serverless, sem depender de Redis.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; remaining: number; retryAfter: number }> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);
  const [row] = await db
    .insert(schema.rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [schema.rateLimits.key, schema.rateLimits.windowStart],
      set: { count: sql`${schema.rateLimits.count} + 1` },
    })
    .returning({ count: schema.rateLimits.count });
  const retryAfter = Math.ceil((windowStart.getTime() + windowSeconds * 1000 - now) / 1000);
  // Limpeza oportunista de janelas antigas (1% das chamadas)
  if (Math.random() < 0.01) {
    await db.delete(schema.rateLimits).where(sql`${schema.rateLimits.windowStart} < now() - interval '2 days'`);
  }
  return { ok: row.count <= limit, remaining: Math.max(0, limit - row.count), retryAfter };
}
