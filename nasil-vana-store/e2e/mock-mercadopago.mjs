/**
 * Servidor de TESTE que imita os endpoints do Mercado Pago usados pela loja
 * (e o ViaCEP). Nunca é usado em produção: só existe para os testes de ponta a ponta
 * exercitarem o fluxo completo — preferência, pagamento, webhook ASSINADO e reembolso.
 *
 * Endpoints:
 *   POST /checkout/preferences        → cria preferência (exige Bearer)
 *   GET  /checkout?pref=ID            → "tela do MP" com botões aprovar / recusar / pendente
 *   POST /checkout/pay                → cria pagamento, envia webhook assinado, redireciona
 *   GET  /v1/payments/:id             → consulta pagamento
 *   POST /v1/payments/:id/refunds     → reembolso + webhook
 *   GET  /ws/:cep/json/               → ViaCEP
 *   POST /__control/tamper            → próxima aprovação com valor alterado (teste de fraude)
 */
import http from "node:http";
import { createHmac, randomUUID } from "node:crypto";

export function startMockMercadoPago({ port = 4010, appUrl = "http://localhost:3000", secret = "e2e-webhook-secret" } = {}) {
  const prefs = new Map();
  const payments = new Map();
  const webhooks = [];
  let seq = 900000;
  let tamper = false;

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { "content-type": typeof body === "string" ? "text/html; charset=utf-8" : "application/json", ...headers });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };
  const readBody = (req) =>
    new Promise((resolve) => {
      let d = "";
      req.on("data", (c) => (d += c));
      req.on("end", () => resolve(d));
    });

  async function fireWebhook(paymentId, { badSignature = false } = {}) {
    const requestId = randomUUID();
    const ts = String(Math.floor(Date.now() / 1000));
    const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", badSignature ? "wrong-secret" : secret).update(manifest).digest("hex");
    const res = await fetch(`${appUrl}/api/webhooks/mercadopago?data.id=${paymentId}&type=payment`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId },
      body: JSON.stringify({ action: "payment.updated", type: "payment", data: { id: String(paymentId) } }),
    });
    webhooks.push({ paymentId, status: res.status, badSignature });
    return res.status;
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const auth = req.headers.authorization ?? "";

    // ViaCEP
    const cep = url.pathname.match(/^\/ws\/(\d{8})\/json\/?$/);
    if (cep) {
      if (cep[1].startsWith("7855")) return send(res, 200, { cep: cep[1], logradouro: "Avenida das Embaúbas", bairro: "Setor Comercial", localidade: "Sinop", uf: "MT" });
      return send(res, 200, { erro: "true" });
    }

    if (url.pathname === "/__control/reset") {
      prefs.clear();
      payments.clear();
      webhooks.length = 0;
      tamper = false;
      return send(res, 200, { ok: true });
    }
    if (url.pathname === "/__control/tamper") {
      tamper = true;
      return send(res, 200, { ok: true });
    }
    if (url.pathname === "/__control/state") return send(res, 200, { prefs: [...prefs.values()], payments: [...payments.values()], webhooks });
    if (url.pathname === "/__control/resend" && req.method === "POST") {
      const { paymentId, bad } = JSON.parse((await readBody(req)) || "{}");
      return send(res, 200, { status: await fireWebhook(paymentId, { badSignature: !!bad }) });
    }

    if (url.pathname === "/checkout/preferences" && req.method === "POST") {
      if (!auth.startsWith("Bearer ")) return send(res, 401, { message: "unauthorized" });
      const body = JSON.parse(await readBody(req));
      const total = body.items.reduce((n, i) => n + Math.round(i.unit_price * 100) * i.quantity, 0);
      const id = `pref-${randomUUID()}`;
      prefs.set(id, { id, body, total, idempotency: req.headers["x-idempotency-key"] });
      return send(res, 201, { id, init_point: `http://localhost:${port}/checkout?pref=${id}` });
    }

    if (url.pathname === "/checkout" && req.method === "GET") {
      const p = prefs.get(url.searchParams.get("pref"));
      if (!p) return send(res, 404, "preferência não encontrada");
      return send(
        res,
        200,
        `<!doctype html><title>Mercado Pago (simulado para testes)</title><h1>Pagar R$ ${(p.total / 100).toFixed(2)}</h1>
<form method="post" action="/checkout/pay"><input type="hidden" name="pref" value="${p.id}">
<button name="status" value="approved" id="aprovar">Aprovar</button>
<button name="status" value="rejected" id="recusar">Recusar</button>
<button name="status" value="pending" id="pendente">Pendente (Pix)</button></form>`,
      );
    }

    if (url.pathname === "/checkout/pay" && req.method === "POST") {
      const form = new URLSearchParams(await readBody(req));
      const p = prefs.get(form.get("pref"));
      const status = form.get("status");
      const id = ++seq;
      const amount = tamper && status === "approved" ? p.total - 1000 : p.total;
      if (tamper && status === "approved") tamper = false;
      payments.set(String(id), {
        id,
        status,
        status_detail: status === "approved" ? "accredited" : status === "rejected" ? "cc_rejected_other_reason" : "pending_waiting_transfer",
        external_reference: p.body.external_reference,
        transaction_amount: amount / 100,
        currency_id: "BRL",
        payment_type_id: status === "pending" ? "bank_transfer" : "credit_card",
        payment_method_id: status === "pending" ? "pix" : "visa",
        installments: 1,
        date_last_updated: new Date().toISOString(),
      });
      await fireWebhook(id);
      const back = p.body.back_urls[status === "approved" ? "success" : status === "pending" ? "pending" : "failure"];
      const sep = back.includes("?") ? "&" : "?";
      res.writeHead(303, { location: `${back}${sep}payment_id=${id}&status=${status}&external_reference=${p.body.external_reference}` });
      return res.end();
    }

    const pay = url.pathname.match(/^\/v1\/payments\/(\d+)(\/refunds)?$/);
    if (pay) {
      if (!auth.startsWith("Bearer ")) return send(res, 401, { message: "unauthorized" });
      const p = payments.get(pay[1]);
      if (!p) return send(res, 404, { message: "not found" });
      if (pay[2] && req.method === "POST") {
        p.status = "refunded";
        p.transaction_amount_refunded = p.transaction_amount;
        p.date_last_updated = new Date(Date.now() + 1000).toISOString();
        setTimeout(() => fireWebhook(p.id), 50);
        return send(res, 201, { id: Date.now(), amount: p.transaction_amount, status: "approved" });
      }
      return send(res, 200, p);
    }
    send(res, 404, { message: "not found" });
  });

  return new Promise((resolve) => server.listen(port, () => resolve({ server, payments, prefs, webhooks, fireWebhook, close: () => server.close() })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startMockMercadoPago().then(() => console.log("mock MP em http://localhost:4010"));
}
