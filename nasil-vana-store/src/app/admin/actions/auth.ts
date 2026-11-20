"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, destroySession, destroyAllSessions, requireAdmin, audit } from "@/lib/auth/session";
import { dummyVerify, hashPassword, passwordProblems, verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/request";
import { sha256 } from "@/lib/crypto";

type State = { error?: string; ok?: boolean; email?: string } | null;

const loginInput = z.object({ email: z.string().trim().toLowerCase().email().max(160), password: z.string().min(1).max(200) });

export async function loginAction(_: State, form: FormData): Promise<State> {
  const parsed = loginInput.safeParse({ email: form.get("email"), password: form.get("password") });
  const generic = "E-mail ou senha incorretos.";
  if (!parsed.success) return { error: generic };
  const { email, password } = parsed.data;
  const fail = (error: string): State => ({ error, email });

  // Força bruta: limite por IP e por conta
  const ip = await clientIpHash();
  const [byIp, byAccount] = await Promise.all([rateLimit(`login-ip:${ip}`, 10, 900), rateLimit(`login-acc:${sha256(email)}`, 6, 900)]);
  if (!byIp.ok || !byAccount.ok) {
    await audit(null, "login_bloqueado", "admin_user", undefined, { email });
    return fail(`Muitas tentativas. Tente novamente em ${Math.ceil(Math.max(byIp.retryAfter, byAccount.retryAfter) / 60)} min.`);
  }

  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)).limit(1);
  if (!user || !user.active) {
    await dummyVerify(password); // tempo constante: não revela se o e-mail existe
    return fail(generic);
  }
  if (!(await verifyPassword(user.passwordHash, password))) {
    await audit(null, "login_falhou", "admin_user", user.id, { email });
    return fail(generic);
  }
  await createSession(user.id);
  await db.update(schema.adminUsers).set({ lastLoginAt: new Date() }).where(eq(schema.adminUsers.id, user.id));
  await audit({ id: user.id, email: user.email, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword }, "login", "admin_user", user.id);
  redirect(user.mustChangePassword ? "/admin/senha" : "/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePasswordAction(_: State, form: FormData): Promise<State> {
  const admin = await requireAdmin({ allowPasswordChange: true });
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, admin.id));
  if (!(await verifyPassword(user.passwordHash, current))) return { error: "Senha atual incorreta." };
  const problem = passwordProblems(next);
  if (problem) return { error: problem };
  if (next !== confirm) return { error: "As senhas não conferem." };
  if (next === current) return { error: "A nova senha deve ser diferente da atual." };
  await db.update(schema.adminUsers).set({ passwordHash: await hashPassword(next), mustChangePassword: false }).where(eq(schema.adminUsers.id, admin.id));
  await destroyAllSessions(admin.id);
  await createSession(admin.id);
  await audit(admin, "senha_alterada", "admin_user", admin.id);
  redirect("/admin?ok=senha");
}
