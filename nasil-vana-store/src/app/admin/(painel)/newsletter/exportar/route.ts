import { isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdmin, audit } from "@/lib/auth/session";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("unauthorized", { status: 401 });
  const rows = await db.select().from(schema.newsletterSubscribers).where(isNull(schema.newsletterSubscribers.unsubscribedAt));
  await audit(admin, "exportou_newsletter", "newsletter", undefined, { count: rows.length });
  const q = (s: string) => `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  const body = ["email;origem;consentimento_em", ...rows.map((r) => [r.email, r.source ?? "", r.consentAt.toISOString()].map(q).join(";"))].join("\n");
  return new Response("﻿" + body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="newsletter.csv"', "cache-control": "no-store" } });
}
