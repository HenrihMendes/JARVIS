import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { isProd } from "@/lib/env";
import { clientIpHash, userAgent } from "@/lib/request";

/**
 * Sessões administrativas no banco (revogáveis), token aleatório de 256 bits em cookie
 * HttpOnly + Secure + SameSite=Strict. O banco guarda apenas o SHA-256 do token.
 * Expiração absoluta de 12 h e por inatividade de 2 h.
 */
export const ADMIN_COOKIE = isProd ? "__Host-nv_admin" : "nv_admin";
const ABSOLUTE_MS = 12 * 60 * 60 * 1000;
const IDLE_MS = 2 * 60 * 60 * 1000;

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "staff";
  mustChangePassword: boolean;
};

export async function createSession(userId: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + ABSOLUTE_MS);
  await db.insert(schema.adminSessions).values({
    id: sha256(token),
    userId,
    expiresAt,
    userAgent: await userAgent(),
    ipHash: await clientIpHash(),
  });
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
  // Limpeza de sessões expiradas
  await db.delete(schema.adminSessions).where(lt(schema.adminSessions.expiresAt, new Date()));
}

export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  await connection(); // sessão é sempre por requisição (nunca pré-renderizada)
  if (!token || token.length > 100) return null;
  const id = sha256(token);
  const [row] = await db
    .select({
      sessionId: schema.adminSessions.id,
      lastSeenAt: schema.adminSessions.lastSeenAt,
      id: schema.adminUsers.id,
      email: schema.adminUsers.email,
      name: schema.adminUsers.name,
      role: schema.adminUsers.role,
      active: schema.adminUsers.active,
      mustChangePassword: schema.adminUsers.mustChangePassword,
    })
    .from(schema.adminSessions)
    .innerJoin(schema.adminUsers, eq(schema.adminUsers.id, schema.adminSessions.userId))
    .where(and(eq(schema.adminSessions.id, id), gt(schema.adminSessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.active) return null;
  if (Date.now() - row.lastSeenAt.getTime() > IDLE_MS) {
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.id, id));
    return null;
  }
  if (Date.now() - row.lastSeenAt.getTime() > 60_000) {
    await db.update(schema.adminSessions).set({ lastSeenAt: new Date() }).where(eq(schema.adminSessions.id, id));
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role, mustChangePassword: row.mustChangePassword };
});

/** Use no início de TODA página e Server Action administrativa. */
export async function requireAdmin(opts: { role?: "owner"; allowPasswordChange?: boolean } = {}): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword && !opts.allowPasswordChange) redirect("/admin/senha");
  if (opts.role === "owner" && admin.role !== "owner") redirect("/admin?erro=permissao");
  return admin;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) await db.delete(schema.adminSessions).where(eq(schema.adminSessions.id, sha256(token)));
  jar.delete(ADMIN_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.delete(schema.adminSessions).where(eq(schema.adminSessions.userId, userId));
}

export async function audit(admin: AdminUser | null, action: string, entity?: string, entityId?: string, details?: unknown) {
  await db.insert(schema.auditLog).values({
    actorId: admin?.id ?? null,
    actorEmail: admin?.email ?? null,
    action,
    entity,
    entityId,
    details: details ?? null,
  });
}
