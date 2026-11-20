/**
 * Testes de ponta a ponta (navegador real + banco real + Mercado Pago simulado).
 *
 *   1. Suba o mock:      node e2e/mock-mercadopago.mjs
 *   2. Suba a loja com:  MP_ACCESS_TOKEN=TEST-e2e MP_WEBHOOK_SECRET=e2e-webhook-secret \
 *                        MP_API_BASE=http://localhost:4010 VIACEP_BASE=http://localhost:4010/ws npm run dev
 *   3. Rode:             npm run test:e2e
 *
 * ATENÇÃO: recria os dados do banco de DESENVOLVIMENTO (seed --reset).
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import postgres from "postgres";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const MOCK = "http://localhost:4010";
const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require(`${execSync("npm root -g").toString().trim()}/playwright`);
}
const { chromium, devices } = playwright;
const sql = postgres(process.env.DATABASE_URL);

let passed = 0;
const failures = [];
async function test(name, fn) {
  const t = Date.now();
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name} (${Date.now() - t} ms)`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n    ${e.message.split("\n").slice(0, 4).join("\n    ")}`);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

async function resetData() {
  execSync("npm run -s db:seed -- --reset", { stdio: "ignore" });
  execSync('npm run -s admin:create -- --email dona@teste.local --name "Dona Teste" --password "frase-secreta-de-teste-2026"', { stdio: "ignore" });
  await sql`UPDATE shipping_methods SET active = true, price_cents = 1500, eta = '1 dia útil' WHERE type = 'local_delivery'`;
  await sql`UPDATE shipping_methods SET active = true WHERE type = 'pickup'`;
  await sql`DELETE FROM rate_limits`;
  await fetch(`${MOCK}/__control/reset`, { method: "POST" });
}

async function fillCheckout(page, { cpf = "529.982.247-25", cep = "78550-200", delivery = true } = {}) {
  await page.fill("#f-email", "cliente@teste.local");
  await page.fill("#f-name", "Maria Cliente Teste");
  await page.fill("#f-phone", "66999990000");
  await page.fill("#f-cpf", cpf);
  if (delivery) {
    await page.fill("#f-cep", cep);
    await page.waitForFunction(() => document.querySelector("#f-street")?.value?.length > 3, null, { timeout: 8000 });
    await page.fill("#f-number", "100");
    await page.check('input[name="shippingMethodId"] >> nth=1').catch(() => undefined);
  }
}

async function addToCart(page, slug, { color, size } = {}) {
  await page.goto(`${BASE}/produto/${slug}`, { waitUntil: "networkidle" });
  if (color) await page.click(`button[aria-label^="${color}"]`);
  if (size) await page.click(`[role=radiogroup] button:has-text("${size}")`);
  await page.click('button:has-text("Adicionar à sacola")');
  await page.waitForSelector('#cart-title', { state: "visible", timeout: 8000 });
}

async function main() {
  console.log("Preparando dados de teste…");
  await resetData();
  const browser = await chromium.launch();
  const errors = [];

  console.log("\nLoja");
  await test("home, catálogo, produto e páginas carregam sem erros de JavaScript", async () => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of ["/", "/loja", "/loja/corsets", "/loja?q=renda", "/produto/vestido-chemise-com-cinto", "/nossa-historia", "/perguntas-frequentes", "/contato"]) {
      const r = await page.goto(BASE + path, { waitUntil: "networkidle" });
      assert(r.status() === 200, `${path} → ${r.status()}`);
    }
    assert(errors.length === 0, `Erros: ${errors.join(" | ")}`);
    await ctx.close();
  });

  await test("busca e filtros por cor funcionam via URL", async () => {
    const page = await browser.newPage();
    await page.goto(`${BASE}/loja?cor=Preto`, { waitUntil: "networkidle" });
    const names = await page.$$eval("article h3", (els) => els.map((e) => e.textContent));
    assert(names.length >= 2 && names.every(Boolean), "esperava produtos pretos");
    await page.goto(`${BASE}/loja?q=xyzinexistente`, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Nada por aqui", { timeout: 6000 });
    await page.close();
  });

  await test("dados estruturados Product/ProductGroup presentes e válidos", async () => {
    const html = await (await fetch(`${BASE}/produto/vestido-chemise-com-cinto`)).text();
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
    const group = blocks.flat().find((b) => b["@type"] === "ProductGroup");
    assert(group && group.hasVariant.length === 2, "ProductGroup com 2 variações não encontrado");
    assert(group.hasVariant.every((v) => v.offers.priceCurrency === "BRL" && v.offers.price === "399.90"), "offers incorretas");
    assert(!JSON.stringify(blocks).includes("aggregateRating"), "não deve haver avaliações inventadas");
  });

  console.log("\nCompra completa (Mercado Pago simulado)");
  let orderToken;
  await test("adicionar à sacola → checkout → pagamento aprovado → pedido pago via webhook assinado", async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await addToCart(page, "vestido-chemise-com-cinto", { color: "Preto", size: "G" });
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await fillCheckout(page);
    await page.click('button:has-text("Ir para o pagamento")');
    await page.waitForURL(`${MOCK}/checkout**`, { timeout: 15000 });
    const [{ stock: reserved }] = await sql`SELECT stock FROM product_variants WHERE sku = (SELECT sku FROM order_items ORDER BY id LIMIT 1)`;
    assert(reserved === 0, `estoque deveria estar reservado (0), está ${reserved}`);
    await page.click("#aprovar");
    await page.waitForURL(`${BASE}/pedido/**`, { timeout: 15000 });
    await page.waitForSelector("text=Obrigada", { timeout: 10000 });
    orderToken = page.url().split("/pedido/")[1].split("?")[0];
    const [o] = await sql`SELECT status, payment_status, total_cents, stock_reserved FROM orders WHERE public_token = ${orderToken}`;
    assert(o.status === "paid" && o.payment_status === "approved", `pedido ${o.status}/${o.payment_status}`);
    assert(o.total_cents === 39990 + 1500, `total ${o.total_cents}`);
    const [{ n }] = await sql`SELECT count(*)::int n FROM cart_items`;
    assert(n === 0, "sacola deveria estar vazia");
    await ctx.close();
  });

  await test("webhook repetido é idempotente (sem efeitos duplicados)", async () => {
    const st = await (await fetch(`${MOCK}/__control/state`)).json();
    const pay = st.payments.at(-1);
    const before = await sql`SELECT count(*)::int n FROM order_events`;
    const r = await (await fetch(`${MOCK}/__control/resend`, { method: "POST", body: JSON.stringify({ paymentId: pay.id }) })).json();
    assert(r.status === 200, `webhook repetido respondeu ${r.status}`);
    const after = await sql`SELECT count(*)::int n FROM order_events`;
    assert(after[0].n === before[0].n, "evento duplicado registrado");
    const [{ n }] = await sql`SELECT count(*)::int n FROM payments`;
    assert(n === 1, `esperava 1 pagamento, há ${n}`);
  });

  await test("webhook com assinatura falsa é recusado (401)", async () => {
    const st = await (await fetch(`${MOCK}/__control/state`)).json();
    const r = await (await fetch(`${MOCK}/__control/resend`, { method: "POST", body: JSON.stringify({ paymentId: st.payments.at(-1).id, bad: true }) })).json();
    assert(r.status === 401, `esperava 401, veio ${r.status}`);
    const forged = await fetch(`${BASE}/api/webhooks/mercadopago?data.id=1&type=payment`, { method: "POST", body: "{}" });
    assert(forged.status === 401, `sem assinatura deveria ser 401, veio ${forged.status}`);
  });

  await test("pagamento com valor adulterado NÃO marca o pedido como pago", async () => {
    await fetch(`${MOCK}/__control/tamper`, { method: "POST" });
    const page = await browser.newPage();
    await addToCart(page, "corset-renda-bege");
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await fillCheckout(page);
    await page.click('button:has-text("Ir para o pagamento")');
    await page.waitForURL(`${MOCK}/checkout**`);
    await page.click("#aprovar");
    await page.waitForURL(`${BASE}/pedido/**`);
    const token = page.url().split("/pedido/")[1].split("?")[0];
    const [o] = await sql`SELECT status FROM orders WHERE public_token = ${token}`;
    assert(o.status === "needs_attention", `esperava needs_attention, veio ${o.status}`);
    await page.close();
  });

  await test("pagamento recusado mantém pedido aguardando; expiração devolve estoque", async () => {
    const page = await browser.newPage();
    await addToCart(page, "blusa-bordada-manga-bufante");
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await fillCheckout(page);
    await page.click('button:has-text("Ir para o pagamento")');
    await page.waitForURL(`${MOCK}/checkout**`);
    await page.click("#recusar");
    await page.waitForURL(`${BASE}/pedido/**`);
    await page.waitForSelector("text=não foi aprovado", { timeout: 8000 });
    await page.waitForSelector("text=Tentar pagar novamente", { timeout: 4000 });
    const token = page.url().split("/pedido/")[1].split("?")[0];
    const [{ stock: s1 }] = await sql`SELECT v.stock FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.slug = 'blusa-bordada-manga-bufante'`;
    assert(s1 === 0, "estoque deveria estar reservado");
    await sql`UPDATE orders SET expires_at = now() - interval '1 minute' WHERE public_token = ${token}`;
    await page.goto(`${BASE}/pedido/${token}`, { waitUntil: "networkidle" });
    const [o] = await sql`SELECT status, stock_reserved FROM orders WHERE public_token = ${token}`;
    const [{ stock: s2 }] = await sql`SELECT v.stock FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.slug = 'blusa-bordada-manga-bufante'`;
    assert(o.status === "expired" && !o.stock_reserved && s2 === 1, `status ${o.status}, estoque ${s2}`);
    await page.close();
  });

  await test("duas clientes disputando a última peça: só uma consegue reservar", async () => {
    const pages = await Promise.all([browser.newContext(), browser.newContext()].map(async (c) => (await c).newPage()));
    for (const p of pages) await addToCart(p, "saia-midi-com-botoes");
    for (const p of pages) {
      await p.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
      await fillCheckout(p);
    }
    await Promise.all(pages.map((p) => p.click('button:has-text("Ir para o pagamento")')));
    await Promise.all(pages.map((p) => p.waitForTimeout(4000)));
    const atMp = pages.filter((p) => p.url().startsWith(MOCK)).length;
    assert(atMp === 1, `esperava 1 cliente no pagamento, foram ${atMp}`);
    const [{ stock }] = await sql`SELECT v.stock FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.slug = 'saia-midi-com-botoes'`;
    assert(stock === 0, `estoque negativo/errado: ${stock}`);
  });

  await test("cupom percentual com limite de uso é aplicado e validado no servidor", async () => {
    await sql`INSERT INTO coupons (code, type, value, max_uses, active) VALUES ('TESTE10', 'percent', 10, 1, true) ON CONFLICT (code) DO NOTHING`;
    const page = await browser.newPage();
    await addToCart(page, "corset-renda-com-alcas", { color: "Rosa" });
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await page.fill("#cupom", "TESTE10");
    await page.click('button:has-text("Aplicar")');
    await page.waitForSelector("text=Cupom TESTE10", { timeout: 6000 });
    await fillCheckout(page);
    await page.click('button:has-text("Ir para o pagamento")');
    await page.waitForURL(`${MOCK}/checkout**`);
    const [o] = await sql`SELECT subtotal_cents, discount_cents, total_cents FROM orders ORDER BY created_at DESC LIMIT 1`;
    assert(o.discount_cents === 1200 && o.total_cents === 12000 - 1200 + 1500, JSON.stringify(o));
    const st = await (await fetch(`${MOCK}/__control/state`)).json();
    assert(st.prefs.at(-1).total === o.total_cents, "valor enviado ao MP difere do pedido");
    await page.close();
  });

  await test("validação do checkout preserva os dados digitados e aponta o erro", async () => {
    const page = await browser.newPage();
    await addToCart(page, "corset-floral-tomara-que-caia");
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await fillCheckout(page, { cpf: "111.111.111-11" });
    await page.click('button:has-text("Ir para o pagamento")');
    await page.waitForSelector("#f-cpf-err", { timeout: 8000 });
    assert((await page.inputValue("#f-email")) === "cliente@teste.local", "e-mail foi apagado");
    assert((await page.inputValue("#f-number")) === "100", "número foi apagado");
    await page.close();
  });

  console.log("\nPainel e segurança");
  await test("painel exige login; senha errada não entra; proprietária vê e despacha pedido", async () => {
    const page = await browser.newPage();
    const r = await page.goto(`${BASE}/admin/pedidos`);
    assert(page.url().includes("/admin/login"), "rota protegida acessível sem login");
    await page.fill("#email", "dona@teste.local");
    await page.fill("#password", "errada");
    await page.click('button[type=submit]');
    await page.waitForSelector("p.field-error");
    await page.fill("#password", "frase-secreta-de-teste-2026");
    await page.click('button[type=submit]');
    await page.waitForURL(/\/admin$/);
    await page.goto(`${BASE}/admin/pedidos?status=paid`, { waitUntil: "networkidle" });
    await page.click("table a >> nth=0");
    await page.waitForSelector("text=Atualizar status");
    await page.fill('input[name="trackingCode"]', "BR123456789");
    await page.click('button:has-text("Salvar rastreio")');
    await page.waitForSelector("text=Rastreio salvo");
    await page.selectOption('select[name="status"]', "shipped");
    await page.click('button:has-text("Atualizar")');
    await page.waitForSelector("text=Status atualizado");
    const [o] = await sql`SELECT status, tracking_code FROM orders WHERE public_token = ${orderToken}`;
    assert(o.status === "shipped" && o.tracking_code === "BR123456789", JSON.stringify(o));
    void r;
    await page.close();
  });

  await test("cabeçalhos de segurança presentes", async () => {
    const res = await fetch(BASE);
    for (const h of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"]) {
      assert(res.headers.get(h), `cabeçalho ausente: ${h}`);
    }
    assert(!res.headers.get("x-powered-by"), "x-powered-by exposto");
  });

  await test("Server Action sem cabeçalho Origin é recusada (CSRF)", async () => {
    const res = await fetch(`${BASE}/admin/login`, { method: "POST", headers: { "next-action": "x", "content-type": "text/plain" }, body: "[]" });
    assert(res.status === 403, `esperava 403, veio ${res.status}`);
  });

  await test("força bruta no login é bloqueada", async () => {
    await sql`DELETE FROM rate_limits`;
    const page = await browser.newPage();
    await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
    let blocked = false;
    for (let i = 0; i < 8 && !blocked; i++) {
      await page.fill("#email", "dona@teste.local");
      await page.fill("#password", `errada-${i}`);
      await page.click('button[type=submit]');
      await page.waitForTimeout(400);
      blocked = (await page.textContent("p.field-error").catch(() => ""))?.includes("Muitas tentativas") ?? false;
    }
    assert(blocked, "não bloqueou após várias tentativas");
    await sql`DELETE FROM rate_limits`;
    await page.close();
  });

  await browser.close();
  await sql.end();
  console.log(`\n${passed} passaram, ${failures.length} falharam`);
  if (failures.length) process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
