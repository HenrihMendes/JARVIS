import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdmin, audit } from "@/lib/auth/session";

export async function GET(_req: Request, ctx: RouteContext<"/admin/clientes/[id]/exportar">) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "owner") return new Response("unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("not found", { status: 404 });
  const customer = await db.query.customers.findFirst({ where: eq(schema.customers.id, id), with: { addresses: true, orders: { with: { items: true } } } });
  if (!customer) return new Response("not found", { status: 404 });
  const [newsletter] = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, customer.email));
  await audit(admin, "cliente_exportada", "customer", id);
  return new Response(JSON.stringify({ exportadoEm: new Date().toISOString(), customer, newsletter: newsletter ?? null }, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="dados-cliente-${id}.json"`, "cache-control": "no-store" },
  });
}
