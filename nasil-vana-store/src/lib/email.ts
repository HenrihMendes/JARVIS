import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { env } from "./env";
import { formatBRL } from "./money";
import { getSettings } from "./settings";

/**
 * E-mails transacionais via Resend (API HTTP, sem SDK). Sem RESEND_API_KEY os e-mails
 * são apenas registrados no log — a loja continua funcionando.
 */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendEmail(to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.info(`[email:desativado] para=${to.replace(/(.{2}).*(@.*)/, "$1***$2")} assunto="${subject}"`);
    return { skipped: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
  return { skipped: false };
}

function layout(storeName: string, title: string, body: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f6f2eb;font-family:Helvetica,Arial,sans-serif;color:#121110">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff" cellpadding="0" cellspacing="0">
<tr><td style="padding:28px 32px;border-bottom:1px solid #e7ddcd;font-family:Georgia,serif;font-size:22px;letter-spacing:.5px">${esc(storeName)}</td></tr>
<tr><td style="padding:32px"><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 16px">${esc(title)}</h1>${body}</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendOrderEmails(orderId: string, kind: "paid" | "shipped" | "ready") {
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId), with: { items: true } });
  if (!order) return;
  const settings = await getSettings().catch(() => null);
  const storeName = settings?.store.name ?? "Nasil Vana Store";
  const link = `${env.SITE_URL.replace(/\/$/, "")}/pedido/${order.publicToken}`;
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.productName)}${i.variantLabel ? `<br><span style="color:#6f665d;font-size:13px">${esc(i.variantLabel)}</span>` : ""}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${i.quantity} × ${formatBRL(i.unitPriceCents)}</td></tr>`,
    )
    .join("");
  const totals = `<table role="presentation" width="100%" style="margin-top:12px;font-size:14px">
<tr><td>Subtotal</td><td align="right">${formatBRL(order.subtotalCents)}</td></tr>
${order.discountCents ? `<tr><td>Desconto</td><td align="right">− ${formatBRL(order.discountCents)}</td></tr>` : ""}
<tr><td>Entrega (${esc(order.shipping.name)})</td><td align="right">${order.shippingCents ? formatBRL(order.shippingCents) : "Grátis"}</td></tr>
<tr><td style="padding-top:8px;font-weight:bold">Total</td><td align="right" style="padding-top:8px;font-weight:bold">${formatBRL(order.totalCents)}</td></tr></table>`;
  const button = `<p style="margin:28px 0 0"><a href="${link}" style="background:#121110;color:#f6f2eb;padding:14px 22px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase">Acompanhar pedido</a></p>`;

  if (kind === "paid") {
    const body = `<p>Olá, ${esc(order.customerName.split(" ")[0])}! Recebemos o pagamento do seu pedido <strong>#${order.number}</strong>. Agora é com a gente.</p>
<table role="presentation" width="100%" style="margin-top:20px;font-size:14px">${rows}</table>${totals}${button}`;
    await sendEmail(order.customerEmail, `Pedido #${order.number} confirmado — ${storeName}`, layout(storeName, "Pedido confirmado", body));
    const notify = settings?.commerce.orderNotificationEmail || settings?.store.email;
    if (notify) {
      await sendEmail(notify, `Novo pedido pago #${order.number} — ${formatBRL(order.totalCents)}`, layout(storeName, `Novo pedido #${order.number}`, `<p>${esc(order.customerName)} — ${esc(order.shipping.name)}</p><table role="presentation" width="100%" style="font-size:14px">${rows}</table>${totals}`));
    }
  } else if (kind === "shipped") {
    const tracking = order.trackingCode ? `<p>Código de rastreio: <strong>${esc(order.trackingCode)}</strong></p>` : "";
    await sendEmail(order.customerEmail, `Seu pedido #${order.number} foi enviado`, layout(storeName, "Pedido enviado", `<p>Seu pedido já está a caminho.</p>${tracking}${button}`));
  } else {
    await sendEmail(order.customerEmail, `Pedido #${order.number} pronto para retirada`, layout(storeName, "Pronto para retirada", `<p>Seu pedido está pronto para ser retirado na loja.</p>${button}`));
  }
}
