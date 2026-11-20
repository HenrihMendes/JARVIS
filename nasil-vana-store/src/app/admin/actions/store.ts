"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin, audit, destroyAllSessions } from "@/lib/auth/session";
import { parseBRLToCents } from "@/lib/money";
import { slugify } from "@/lib/text";
import { settingsSchemas, type SettingsKey } from "@/lib/settings-schema";
import { ImageValidationError, processAndStoreImage } from "@/lib/images";
import { hashPassword } from "@/lib/auth/password";
import { randomBytes } from "node:crypto";
import type { ActionState } from "@/components/admin/ui";

const uuid = z.string().uuid();
const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const bool = (f: FormData, k: string) => f.get(k) === "on";
const optMoney = (v: string) => (v ? parseBRLToCents(v) : null);
const fail = (message: string, errors?: Record<string, string>): ActionState => ({ ok: false, message, errors });
const done = (message = "Salvo."): ActionState => {
  refresh();
  return { ok: true, message };
};

/* -------------------------------- Categorias -------------------------------- */

export async function saveCategoryAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name", 60);
  if (name.length < 2) return fail("Informe o nome.", { name: "Informe o nome." });
  const slug = slugify(str(f, "slug") || name);
  const values = {
    name,
    slug,
    description: str(f, "description", 300) || null,
    seoTitle: str(f, "seoTitle", 70) || null,
    seoDescription: str(f, "seoDescription", 170) || null,
    sortOrder: Number(f.get("sortOrder")) || 0,
    active: bool(f, "active"),
  };
  try {
    if (id) await db.update(schema.categories).set(values).where(eq(schema.categories.id, uuid.parse(id)));
    else await db.insert(schema.categories).values(values);
  } catch {
    return fail("Já existe uma categoria com este endereço.");
  }
  await audit(admin, id ? "categoria_atualizada" : "categoria_criada", "category", id || slug);
  return done("Categoria salva.");
}

export async function deleteCategoryAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = uuid.parse(f.get("id"));
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  await audit(admin, "categoria_excluida", "category", id);
  return done("Categoria excluída. Os produtos ficaram sem categoria.");
}

/* ----------------------------- Cores e tamanhos ----------------------------- */

export async function saveColorAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name", 40);
  const hex = str(f, "hex", 7);
  if (name.length < 2) return fail("Informe o nome da cor.");
  if (hex && !/^#[0-9a-fA-F]{6}$/.test(hex)) return fail("Cor inválida.");
  const values = { name, hex: hex || null, sortOrder: Number(f.get("sortOrder")) || 0 };
  try {
    if (id) await db.update(schema.colors).set(values).where(eq(schema.colors.id, uuid.parse(id)));
    else await db.insert(schema.colors).values(values);
  } catch {
    return fail("Já existe uma cor com este nome.");
  }
  return done("Cor salva.");
}

export async function deleteColorAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.delete(schema.colors).where(eq(schema.colors.id, uuid.parse(f.get("id"))));
  } catch {
    return fail("Esta cor está em uso em alguma variação. Remova das variações primeiro.");
  }
  return done("Cor excluída.");
}

export async function saveSizeAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const label = str(f, "label", 12);
  if (!label) return fail("Informe o tamanho.");
  const values = { label, sortOrder: Number(f.get("sortOrder")) || 0 };
  try {
    if (id) await db.update(schema.sizes).set(values).where(eq(schema.sizes.id, uuid.parse(id)));
    else await db.insert(schema.sizes).values(values);
  } catch {
    return fail("Este tamanho já existe.");
  }
  return done("Tamanho salvo.");
}

export async function deleteSizeAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.delete(schema.sizes).where(eq(schema.sizes.id, uuid.parse(f.get("id"))));
  } catch {
    return fail("Este tamanho está em uso em alguma variação.");
  }
  return done("Tamanho excluído.");
}

/* ---------------------------------- Cupons ---------------------------------- */

export async function saveCouponAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const code = str(f, "code", 40).toUpperCase();
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return fail("Código: 3 a 40 letras/números, sem espaços.", { code: "Código inválido." });
  const type = z.enum(["percent", "fixed", "free_shipping"]).parse(f.get("type"));
  let value = 0;
  try {
    if (type === "percent") {
      value = Math.round(Number(str(f, "value").replace(",", ".")));
      if (!(value >= 1 && value <= 100)) return fail("Percentual entre 1 e 100.", { value: "Entre 1 e 100." });
    } else if (type === "fixed") {
      value = parseBRLToCents(str(f, "value"));
    }
  } catch {
    return fail("Valor inválido.", { value: "Valor inválido." });
  }
  const parseDate = (k: string) => {
    const v = str(f, k);
    return v ? new Date(`${v}T00:00:00-04:00`) : null; // horário de Cuiabá
  };
  const values = {
    code,
    description: str(f, "description", 160) || null,
    type,
    value,
    minSubtotalCents: str(f, "minSubtotal") ? parseBRLToCents(str(f, "minSubtotal")) : 0,
    startsAt: parseDate("startsAt"),
    endsAt: (() => {
      const d = parseDate("endsAt");
      return d ? new Date(d.getTime() + 86_399_000) : null;
    })(),
    maxUses: str(f, "maxUses") ? Math.max(1, Number(str(f, "maxUses")) || 1) : null,
    active: bool(f, "active"),
  };
  try {
    if (id) await db.update(schema.coupons).set(values).where(eq(schema.coupons.id, uuid.parse(id)));
    else await db.insert(schema.coupons).values(values);
  } catch {
    return fail("Já existe um cupom com este código.");
  }
  await audit(admin, "cupom_salvo", "coupon", code);
  return done("Cupom salvo.");
}

/* ----------------------------------- Frete ----------------------------------- */

export async function saveShippingAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const type = z.enum(["pickup", "local_delivery", "shipping"]).parse(f.get("type"));
  const name = str(f, "name", 60);
  if (name.length < 3) return fail("Informe o nome.");
  const ranges = str(f, "cepRanges", 2000);
  if (ranges && !ranges.split(/[,;\n]/).every((r) => /^\s*\d{5}-?\d{3}(\s*-\s*\d{5}-?\d{3})?\s*$/.test(r) || !r.trim())) {
    return fail("Faixas de CEP inválidas. Ex.: 78550000-78559999", { cepRanges: "Formato inválido." });
  }
  let price = 0;
  let freeAbove: number | null = null;
  try {
    price = type === "pickup" ? 0 : str(f, "price") ? parseBRLToCents(str(f, "price")) : 0;
    freeAbove = optMoney(str(f, "freeAbove"));
  } catch {
    return fail("Valor inválido.");
  }
  if (bool(f, "active") && type !== "pickup" && price === 0 && !bool(f, "confirmFree")) {
    return fail("Frete com valor R$ 0,00. Se for realmente grátis, marque a confirmação.", { price: "Confirme frete grátis." });
  }
  const values = {
    name,
    description: str(f, "description", 200) || null,
    type,
    priceCents: price,
    freeAboveCents: freeAbove,
    cepRanges: ranges.replace(/(\d{5})-(\d{3})/g, "$1$2") || null,
    eta: str(f, "eta", 80) || null,
    active: bool(f, "active"),
    sortOrder: Number(f.get("sortOrder")) || 0,
  };
  if (id) await db.update(schema.shippingMethods).set(values).where(eq(schema.shippingMethods.id, uuid.parse(id)));
  else await db.insert(schema.shippingMethods).values(values);
  await audit(admin, "frete_salvo", "shipping", name);
  return done("Forma de entrega salva.");
}

export async function deleteShippingAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  await db.delete(schema.shippingMethods).where(eq(schema.shippingMethods.id, uuid.parse(f.get("id"))));
  return done("Removida.");
}

/* ---------------------------------- Banners ---------------------------------- */

async function maybeUpload(f: FormData, key: string) {
  const file = f.get(key);
  if (!(file instanceof File) || file.size === 0) return undefined;
  const img = await processAndStoreImage(Buffer.from(await file.arrayBuffer()));
  const [m] = await db.insert(schema.media).values({ ...img, alt: str(f, `${key}Alt`, 200) || str(f, "title", 200), originalName: file.name.slice(0, 120) }).returning({ id: schema.media.id });
  return m.id;
}

export async function saveBannerAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const title = str(f, "title", 120);
  if (title.length < 2) return fail("Informe o título.");
  const href = str(f, "ctaHref", 200);
  if (href && !/^\/(?!\/)/.test(href) && !/^https:\/\//.test(href)) return fail("Link deve começar com / (página da loja) ou https://");
  try {
    const mediaId = await maybeUpload(f, "image");
    const secondaryMediaId = await maybeUpload(f, "image2");
    const values = {
      placement: z.enum(["hero", "campaign", "announcement"]).parse(f.get("placement")),
      eyebrow: str(f, "eyebrow", 60) || null,
      title,
      subtitle: str(f, "subtitle", 200) || null,
      ctaLabel: str(f, "ctaLabel", 40) || null,
      ctaHref: href || null,
      active: bool(f, "active"),
      sortOrder: Number(f.get("sortOrder")) || 0,
      ...(mediaId ? { mediaId } : {}),
      ...(secondaryMediaId ? { secondaryMediaId } : {}),
    };
    if (id) await db.update(schema.banners).set(values).where(eq(schema.banners.id, uuid.parse(id)));
    else await db.insert(schema.banners).values(values);
  } catch (e) {
    if (e instanceof ImageValidationError) return fail(e.message);
    throw e;
  }
  await audit(admin, "banner_salvo", "banner", id || title);
  return done("Banner salvo.");
}

export async function deleteBannerAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  await db.delete(schema.banners).where(eq(schema.banners.id, uuid.parse(f.get("id"))));
  return done("Banner excluído.");
}

/* ------------------------------ Páginas e FAQ ------------------------------ */

export async function savePageAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const slug = str(f, "slug", 60);
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return fail("Endereço inválido.");
  const values = { slug, title: str(f, "title", 120), body: String(f.get("body") ?? "").slice(0, 60000), seoDescription: str(f, "seoDescription", 170) || null, published: bool(f, "published") };
  if (!values.title) return fail("Informe o título.");
  await db.insert(schema.pages).values(values).onConflictDoUpdate({ target: schema.pages.slug, set: values });
  await audit(admin, "pagina_salva", "page", slug);
  return done("Página salva.");
}

export async function saveFaqAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const values = { question: str(f, "question", 200), answer: str(f, "answer", 2000), sortOrder: Number(f.get("sortOrder")) || 0, active: bool(f, "active") };
  if (!values.question || !values.answer) return fail("Preencha pergunta e resposta.");
  if (id) await db.update(schema.faqs).set(values).where(eq(schema.faqs.id, uuid.parse(id)));
  else await db.insert(schema.faqs).values(values);
  return done("Pergunta salva.");
}

export async function deleteFaqAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  await db.delete(schema.faqs).where(eq(schema.faqs.id, uuid.parse(f.get("id"))));
  return done("Removida.");
}

/* ------------------------------- Configurações ------------------------------- */

export async function saveSettingsAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin({ role: "owner" });
  const key = z.enum(["store", "commerce", "seo", "announcement"]).parse(f.get("_key")) as SettingsKey;
  const raw: Record<string, unknown> = {};
  for (const [k, v] of f.entries()) {
    if (k.startsWith("_") || k.startsWith("$")) continue;
    raw[k] = typeof v === "string" ? v : "";
  }
  // Checkboxes e números
  const shape = settingsSchemas[key].shape as Record<string, z.ZodTypeAny>;
  for (const k of Object.keys(shape)) {
    const def = settingsSchemas[key].parse({})[k as never] as unknown;
    if (typeof def === "boolean") raw[k] = f.get(k) === "on";
    else if (typeof def === "number" || def === null) {
      const v = String(raw[k] ?? "").trim();
      raw[k] = v === "" ? (def === null ? null : undefined) : Number(v);
    }
  }
  const parsed = settingsSchemas[key].safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= "Valor inválido.";
    return fail("Revise os campos destacados.", errors);
  }
  await db.insert(schema.settings).values({ key, value: parsed.data }).onConflictDoUpdate({ target: schema.settings.key, set: { value: parsed.data } });
  await audit(admin, "configuracoes_salvas", "settings", key);
  return done("Configurações salvas.");
}

/* ----------------------------------- Usuários ----------------------------------- */

export async function createAdminUserAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin({ role: "owner" });
  const email = str(f, "email", 160).toLowerCase();
  const name = str(f, "name", 80);
  const role = z.enum(["owner", "staff"]).parse(f.get("role"));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || name.length < 2) return fail("Informe nome e e-mail válidos.");
  const temp = randomBytes(12).toString("base64url");
  try {
    await db.insert(schema.adminUsers).values({ email, name, role, passwordHash: await hashPassword(temp), mustChangePassword: true });
  } catch {
    return fail("Já existe um usuário com este e-mail.");
  }
  await audit(admin, "usuario_criado", "admin_user", email, { role });
  refresh();
  return { ok: true, message: `Usuário criado. Senha temporária (copie agora, não será mostrada de novo): ${temp}` };
}

export async function toggleAdminUserAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin({ role: "owner" });
  const id = uuid.parse(f.get("id"));
  if (id === admin.id) return fail("Você não pode desativar o próprio usuário.");
  const [u] = await db.update(schema.adminUsers).set({ active: sql`NOT ${schema.adminUsers.active}` }).where(eq(schema.adminUsers.id, id)).returning();
  if (u && !u.active) await destroyAllSessions(id);
  await audit(admin, u?.active ? "usuario_ativado" : "usuario_desativado", "admin_user", id);
  return done(u?.active ? "Usuário reativado." : "Usuário desativado e desconectado.");
}

/* ----------------------------------- Clientes ----------------------------------- */

/**
 * LGPD — eliminação a pedido da titular. Anonimiza o cadastro e endereços.
 * Os pedidos mantêm os dados necessários ao cumprimento de obrigação legal/fiscal (art. 16, I).
 */
export async function anonymizeCustomerAction(_: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin({ role: "owner" });
  const id = uuid.parse(f.get("id"));
  await db.transaction(async (tx) => {
    const [c] = await tx.select().from(schema.customers).where(eq(schema.customers.id, id));
    if (!c) return;
    await tx.delete(schema.addresses).where(eq(schema.addresses.customerId, id));
    await tx
      .update(schema.customers)
      .set({ email: `anonimizado-${id}@invalid.local`, name: "Cliente anonimizada", phone: null, cpf: null, marketingConsent: false, marketingConsentAt: null, anonymizedAt: new Date() })
      .where(eq(schema.customers.id, id));
    await tx.update(schema.newsletterSubscribers).set({ unsubscribedAt: new Date() }).where(eq(schema.newsletterSubscribers.email, c.email));
  });
  await audit(admin, "cliente_anonimizada", "customer", id);
  return done("Cadastro anonimizado. Pedidos mantidos apenas para fins fiscais/legais.");
}
