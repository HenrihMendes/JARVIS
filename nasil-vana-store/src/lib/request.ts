import "server-only";
import { headers } from "next/headers";
import { hmacHex } from "./crypto";
import { env } from "./env";

/** IP do cliente (confia no primeiro valor de X-Forwarded-For definido pelo proxy reverso). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "0.0.0.0";
}

/** IP pseudonimizado (HMAC) — nunca gravamos o IP puro (minimização LGPD). */
export async function clientIpHash(): Promise<string> {
  return hmacHex(env.APP_SECRET, `ip:${await clientIp()}`).slice(0, 32);
}

export async function userAgent(): Promise<string> {
  return ((await headers()).get("user-agent") ?? "").slice(0, 250);
}
