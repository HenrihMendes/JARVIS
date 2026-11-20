/**
 * Popula o banco com o catálogo inicial e os conteúdos-modelo.
 *
 *   npm run db:seed            → só executa se o banco estiver vazio
 *   npm run db:seed -- --reset → APAGA catálogo, conteúdos e pedidos e recria (apenas desenvolvimento)
 *
 * As fotos do catálogo inicial são geradas em public/media/... a cada build (arquivos estáticos
 * servidos pela CDN, com nomes fixos "seed-..."), então funcionam em qualquer hospedagem.
 * Se ADMIN_EMAIL e ADMIN_PASSWORD estiverem definidas e não houver usuário no painel,
 * cria a conta da proprietária (troca de senha obrigatória no 1º acesso).
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "../src/lib/auth/password";
import { sql as dsql } from "drizzle-orm";
import { createDb } from "../src/db/client";
import * as s from "../src/db/schema";
import { processAndStoreImage, type ProcessedImage } from "../src/lib/images";
import { CROPS } from "./crops";
import { editorialGrade } from "./grade";
import { SEED_CATEGORIES, SEED_COLORS, SEED_PRODUCTS, SEED_SIZES } from "./catalog";
import { FAQ_TEMPLATES, PAGE_TEMPLATES, SIZE_GUIDE_PAGE } from "./pages";

const reset = process.argv.includes("--reset");

/** Grava as variações da foto em public/media/<chave>/ (servidas como arquivos estáticos). */
const writePublic = async (key: string, body: Buffer) => {
  const file = path.join("public", "media", key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
};

async function buildSeedImages() {
  const out = new Map<string, ProcessedImage>();
  for (const c of CROPS) {
    const buf = await sharp(`seed/originals/${c.src}`)
      .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
      .png()
      .toBuffer();
    out.set(c.out, await processAndStoreImage(await editorialGrade(buf), {
      minSize: 150,
      key: `media/seed-${c.out}`,
      // Com S3/R2 as fotos vão para o bucket; nos demais casos viram arquivos estáticos do site
      write: process.env.STORAGE_DRIVER === "s3" ? undefined : writePublic,
    }));
    process.stdout.write(".");
  }
  console.log(`\n${CROPS.length} fotos do catálogo inicial geradas em public/media`);
  return out;
}

async function ensureOwner(db: ReturnType<typeof createDb>["db"]) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const [{ n }] = await db.select({ n: dsql<number>`count(*)::int` }).from(s.adminUsers);
  if (n > 0) return;
  if (password.length < 12) throw new Error("ADMIN_PASSWORD precisa ter pelo menos 12 caracteres.");
  await db.insert(s.adminUsers).values({ email, name: "Proprietária", role: "owner", passwordHash: await hashPassword(password), mustChangePassword: true });
  console.log(`Conta do painel criada para ${email} (troca de senha obrigatória no 1º acesso).`);
}

async function main() {
  const { db, sql } = createDb();
  try {
    const images = await buildSeedImages();
    await ensureOwner(db);
    const [{ count }] = await db.select({ count: dsql<number>`count(*)::int` }).from(s.products);
    if (count > 0 && !reset) {
      console.log("Banco já possui produtos: catálogo mantido.");
      return;
    }
    if (reset) {
      if (process.env.NODE_ENV === "production") throw new Error("--reset bloqueado em produção");
      console.log("Limpando dados…");
      await sql`TRUNCATE order_events, order_items, payments, orders, cart_items, carts, product_images, product_variants, products, categories, colors, sizes, banners, media, pages, faqs, shipping_methods, coupons, settings, webhook_events RESTART IDENTITY CASCADE`;
    }

    /* Imagens -------------------------------------------------------------- */
    const mediaByCrop = new Map<string, string>();
    const altByCrop = new Map<string, { alt: string; focalY?: number }>();
    for (const p of SEED_PRODUCTS) for (const i of p.images) altByCrop.set(i.crop, { alt: i.alt, focalY: i.focalY });
    for (const c of CROPS) {
      const meta = altByCrop.get(c.out);
      const [row] = await db
        .insert(s.media)
        .values({ ...images.get(c.out)!, alt: meta?.alt ?? c.out, focalY: meta?.focalY ?? 30, originalName: `${c.out}.png` })
        .returning({ id: s.media.id });
      mediaByCrop.set(c.out, row.id);
    }

    /* Taxonomia ------------------------------------------------------------ */
    const cats = await db
      .insert(s.categories)
      .values(SEED_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })))
      .returning();
    const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));

    const cols = await db
      .insert(s.colors)
      .values(SEED_COLORS.map((c, i) => ({ name: c.name, hex: c.hex ?? null, swatch: c.swatch ?? null, sortOrder: i })))
      .returning();
    const colorByName = new Map(cols.map((c) => [c.name, c.id]));

    const szs = await db.insert(s.sizes).values(SEED_SIZES.map((label, i) => ({ label, sortOrder: i }))).returning();
    const sizeByLabel = new Map(szs.map((z) => [z.label, z.id]));

    /* Produtos ------------------------------------------------------------- */
    let order = 0;
    for (const p of SEED_PRODUCTS) {
      const [prod] = await db
        .insert(s.products)
        .values({
          slug: p.slug,
          name: p.name,
          subtitle: p.subtitle,
          description: p.description,
          composition: p.composition,
          fitNotes: p.fitNotes,
          status: p.status,
          categoryId: catBySlug.get(p.category)!,
          priceCents: p.price ?? null,
          featured: p.featured ?? false,
          isNew: p.isNew ?? false,
          imageNotice: "Imagens de divulgação. Cores e detalhes podem variar levemente em relação à peça.",
          internalNotes: p.internalNotes,
          brand: "Nasil Vana Store",
          sortOrder: order++,
          publishedAt: p.status === "active" ? new Date() : null,
        })
        .returning({ id: s.products.id });

      await db.insert(s.productImages).values(
        p.images.map((img, i) => ({
          productId: prod.id,
          mediaId: mediaByCrop.get(img.crop)!,
          colorId: img.color ? colorByName.get(img.color)! : null,
          sortOrder: i,
        })),
      );

      if (p.variants.length) {
        await db.insert(s.productVariants).values(
          p.variants.map((v, i) => ({
            productId: prod.id,
            colorId: v.color ? colorByName.get(v.color)! : null,
            sizeId: v.size ? sizeByLabel.get(v.size)! : null,
            sku: `NV-${p.slug.split("-").map((w) => w[0]).join("").toUpperCase()}-${String(order).padStart(2, "0")}${i + 1}`,
            // Pôster não informa quantidade: 1 un. por variação anunciada. Rascunhos ficam com 0.
            stock: p.status === "active" ? (v.stock ?? 1) : 0,
          })),
        );
      }
    }
    console.log(`${SEED_PRODUCTS.length} produtos cadastrados`);

    /* Banners --------------------------------------------------------------- */
    await db.insert(s.banners).values([
      {
        placement: "hero",
        eyebrow: "Alfaiataria · Corsets · Vestidos",
        title: "Sofisticação que impõe presença.",
        subtitle: "Elegância em cada detalhe. Poder em cada escolha.",
        ctaLabel: "Explorar a loja",
        ctaHref: "/loja",
        mediaId: mediaByCrop.get("fivela-azul")!,
        secondaryMediaId: mediaByCrop.get("fivela-bege")!,
        sortOrder: 0,
      },
      {
        placement: "campaign",
        eyebrow: "Coleção de corsets",
        title: "Renda que valoriza.",
        subtitle: "Femininos e cheios de charme — em renda, jacquard e estampas florais.",
        ctaLabel: "Ver corsets",
        ctaHref: "/loja/corsets",
        mediaId: mediaByCrop.get("corset-renda-preto-modelo")!,
        secondaryMediaId: mediaByCrop.get("corset-floral-colorido-produto")!,
        sortOrder: 0,
      },
      {
        placement: "campaign",
        eyebrow: "Para o trabalho e além",
        title: "Do escritório ao evento.",
        subtitle: "Peças de alfaiataria e vestidos estruturados para quem escolhe se destacar.",
        ctaLabel: "Ver vestidos",
        ctaHref: "/loja/vestidos",
        mediaId: mediaByCrop.get("vestido-offwhite")!,
        secondaryMediaId: mediaByCrop.get("colete-berinjela")!,
        sortOrder: 1,
      },
    ]);

    /* Páginas e FAQ -------------------------------------------------------- */
    await db.insert(s.pages).values([...PAGE_TEMPLATES, SIZE_GUIDE_PAGE]);
    await db.insert(s.faqs).values(FAQ_TEMPLATES.map((f, i) => ({ ...f, sortOrder: i })));

    /* Frete (INATIVO até a proprietária configurar preços e endereço) ------- */
    await db.insert(s.shippingMethods).values([
      {
        name: "Retirada na loja",
        description: "Retire seu pedido na loja em Sinop após a confirmação do pagamento.",
        type: "pickup",
        priceCents: 0,
        eta: "Disponível após confirmação",
        active: false,
        sortOrder: 0,
      },
      {
        name: "Entrega em Sinop",
        description: "Entrega local dentro de Sinop, MT.",
        type: "local_delivery",
        priceCents: 0,
        cepRanges: "78550000-78559999",
        eta: "A definir",
        active: false,
        sortOrder: 1,
      },
    ]);

    /* Configurações ---------------------------------------------------------- */
    await db
      .insert(s.settings)
      .values([
        { key: "store", value: { name: "Nasil Vana Store", addressCity: "Sinop", addressState: "MT", tagline: "Moda que valoriza você." } },
        { key: "commerce", value: {} },
        { key: "seo", value: {} },
        { key: "announcement", value: { enabled: false } },
      ])
      .onConflictDoNothing();

    console.log("Seed concluído.");
    const drafts = SEED_PRODUCTS.filter((p) => p.status !== "active").map((p) => `  - ${p.name} (${p.status})`);
    console.log(`\nProdutos que precisam de informação antes de publicar:\n${drafts.join("\n")}`);
    console.log("\nFrete está DESATIVADO até você configurar valores em Painel → Frete.");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
