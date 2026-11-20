import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id com parâmetros da OWASP Password Storage Cheat Sheet
 * (m=19 MiB, t=2, p=1). O hash inclui sal aleatório e os parâmetros.
 */
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 as const };

export const hashPassword = (password: string) => hash(password, OPTIONS);

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}

/** Hash fixo usado para gastar o mesmo tempo quando o e-mail não existe (evita enumeração). */
let dummy: string | null = null;
export async function dummyVerify(password: string) {
  dummy ??= await hashPassword("nasil-vana-dummy-password-for-timing");
  await verifyPassword(dummy, password);
}

export function passwordProblems(pw: string): string | null {
  if (pw.length < 12) return "Use pelo menos 12 caracteres.";
  if (pw.length > 128) return "Senha muito longa.";
  if (/^(.)\1+$/.test(pw)) return "Senha muito fraca.";
  const common = ["123456789012", "senha1234567", "nasilvana123", "password1234"];
  if (common.some((c) => pw.toLowerCase().includes(c))) return "Senha muito comum.";
  return null;
}
