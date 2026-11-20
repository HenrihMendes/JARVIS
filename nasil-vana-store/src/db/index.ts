import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as { __nvSql?: ReturnType<typeof postgres> };

const sql =
  globalForDb.__nvSql ??
  postgres(env.DATABASE_URL, {
    max: env.DATABASE_POOL_MAX,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: env.DATABASE_PREPARE,
    // Só força SSL quando pedido; caso contrário vale o "sslmode" da própria URL (ex.: Neon exige sslmode=require).
    // Passar ssl:false aqui anularia o sslmode da URL.
    ...(env.DATABASE_SSL ? { ssl: "require" as const } : {}),
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== "production") globalForDb.__nvSql = sql;

export const db = drizzle(sql, { schema, casing: "snake_case" });
export type DB = typeof db;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export { schema };
