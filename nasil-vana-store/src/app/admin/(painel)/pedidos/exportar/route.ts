import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdmin, audit } from "@/lib/auth/session";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/orders";

const csv = (v: unknown) => {
  const s = String(v ?? "");
  // Evita injeção de fórmulas ao abrir no Excel/Sheets
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return new Response("unauthorized", { status: 401 });
  const status = new URL(req.url).searchParams.get("status");
  const rows = await db
    .select()
    .from(schema.orders)
    .where(status && status in ORDER_STATUS_LABEL ? eq(schema.orders.status, status as OrderStatus) : undefined)
    .orderBy(desc(schema.orders.createdAt))
    .limit(5000);
  const header = ["numero", "data", "status", "pagamento", "cliente", "email", "telefone", "entrega", "subtotal", "desconto", "frete", "total", "cupom", "rastreio"];
  const lines = rows.map((o) =>
    [o.number, o.createdAt.toISOString(), ORDER_STATUS_LABEL[o.status], o.paymentStatus, o.customerName, o.customerEmail, o.customerPhone, o.shipping.name, o.subtotalCents / 100, o.discountCents / 100, o.shippingCents / 100, o.totalCents / 100, o.couponCode, o.trackingCode]
      .map(csv)
      .join(";"),
  );
  await audit(admin, "exportou_pedidos", "order", undefined, { count: rows.length });
  return new Response("﻿" + [header.join(";"), ...lines].join("\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
