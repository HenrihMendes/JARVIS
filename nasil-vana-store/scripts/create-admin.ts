/**
 * Cria (ou redefine a senha de) um usuário administrativo.
 *
 *   npm run admin:create -- --email dona@loja.com.br --name "Nome" [--role owner|staff]
 *
 * Uma senha forte aleatória é gerada e exibida UMA vez. No primeiro acesso o painel exige a troca.
 */
import { randomBytes } from "node:crypto";
import { createDb } from "../src/db/client";
import * as s from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim() || "Administração";
  const role = (arg("role") === "staff" ? "staff" : "owner") as "owner" | "staff";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("Informe --email válido");
    process.exit(1);
  }
  const password = arg("password") ?? randomBytes(15).toString("base64url");
  const { db, sql } = createDb();
  try {
    const passwordHash = await hashPassword(password);
    await db
      .insert(s.adminUsers)
      .values({ email, name, role, passwordHash, mustChangePassword: !arg("password") })
      .onConflictDoUpdate({
        target: s.adminUsers.email,
        set: { passwordHash, mustChangePassword: !arg("password"), active: true },
      });
    console.log(`\nUsuário: ${email} (${role})`);
    if (!arg("password")) console.log(`Senha temporária: ${password}\nGuarde agora — ela não será exibida novamente.`);
  } finally {
    await sql.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
