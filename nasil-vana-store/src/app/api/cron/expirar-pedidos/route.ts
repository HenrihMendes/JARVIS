import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { expireStaleOrders } from "@/lib/orders";

/** Tarefa agendada: libera reservas de pedidos não pagos. Autenticação: Authorization: Bearer CRON_SECRET. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!env.CRON_SECRET || !safeEqual(auth, `Bearer ${env.CRON_SECRET}`)) return new NextResponse("unauthorized", { status: 401 });
  const expired = await expireStaleOrders(200);
  return NextResponse.json({ expired });
}
