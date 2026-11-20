import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/** Cliente para scripts (seed, migrações, testes). A aplicação usa `@/db`. */
export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL não definida");
  const sql = postgres(url, { max: 4, onnotice: () => {} });
  return { db: drizzle(sql, { schema, casing: "snake_case" }), sql };
}
