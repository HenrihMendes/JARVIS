import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  Convenções                                                                 */
/*  - Valores monetários SEMPRE em centavos (integer). Nunca float.            */
/*  - Datas em timestamptz.                                                    */
/*  - Dados de cartão NUNCA são armazenados (pagamento 100% no Mercado Pago).  */
/* -------------------------------------------------------------------------- */

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const adminRole = pgEnum("admin_role", ["owner", "staff"]);
export const productStatus = pgEnum("product_status", ["draft", "active", "coming_soon", "archived"]);
export const orderStatus = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "preparing",
  "ready_for_pickup",
  "shipped",
  "delivered",
  "cancelled",
  "expired",
  "refunded",
  "needs_attention",
]);
export const paymentStatus = pgEnum("payment_status", [
  "none",
  "pending",
  "in_process",
  "approved",
  "authorized",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
  "in_mediation",
]);
export const couponType = pgEnum("coupon_type", ["percent", "fixed", "free_shipping"]);
export const shippingType = pgEnum("shipping_type", ["pickup", "local_delivery", "shipping"]);
export const bannerPlacement = pgEnum("banner_placement", ["hero", "campaign", "announcement"]);

/* ------------------------------- Administração ------------------------------ */

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRole("role").notNull().default("staff"),
  active: boolean("active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const adminSessions = pgTable(
  "admin_sessions",
  {
    /** SHA-256 do token. O token em si só existe no cookie do navegador. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    createdAt: createdAt(),
  },
  (t) => [index("admin_sessions_user_idx").on(t.userId)],
);

/** Janela fixa de rate limit compartilhada por todas as instâncias (fica no banco). */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    actorId: uuid("actor_id").references(() => adminUsers.id, { onDelete: "set null" }),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    details: jsonb("details"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

/* --------------------------------- Mídia ---------------------------------- */

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Prefixo no storage: media/<id> — arquivos: <w>.avif / <w>.webp */
  key: text("key").notNull().unique(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  /** Larguras geradas (ex.: [320, 640, 960, 1280]) */
  widths: jsonb("widths").$type<number[]>().notNull(),
  /** Placeholder minúsculo em base64 (LQIP) */
  blurDataUrl: text("blur_data_url"),
  alt: text("alt").notNull().default(""),
  /** Ponto focal vertical (0–100) para recortes em grade */
  focalY: integer("focal_y").notNull().default(30),
  originalName: text("original_name"),
  bytes: integer("bytes"),
  createdAt: createdAt(),
});

/* -------------------------------- Catálogo -------------------------------- */

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const colors = pgTable("colors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  /** Hex (#RRGGBB) ou nulo para estampas — nesse caso usa `swatch` */
  hex: text("hex"),
  /** CSS de fundo opcional para estampas (gradiente) */
  swatch: text("swatch"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const sizes = pgTable("sizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    subtitle: text("subtitle"),
    description: text("description").notNull().default(""),
    composition: text("composition"),
    care: text("care"),
    fitNotes: text("fit_notes"),
    status: productStatus("status").notNull().default("draft"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    /** Preço de venda (centavos). Pode ser nulo em rascunho/em breve. */
    priceCents: integer("price_cents"),
    /** Preço "de" (riscado). Só é exibido se for maior que o preço atual. */
    compareAtCents: integer("compare_at_cents"),
    featured: boolean("featured").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),
    /** Aviso exibido na página (ex.: "Imagens ilustrativas"). */
    imageNotice: text("image_notice"),
    /** Observações internas (não aparecem na loja). */
    internalNotes: text("internal_notes"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    gtin: text("gtin"),
    brand: text("brand"),
    weightGrams: integer("weight_grams"),
    sortOrder: integer("sort_order").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_status_idx").on(t.status),
    index("products_category_idx").on(t.categoryId),
    check("products_price_positive", sql`${t.priceCents} IS NULL OR ${t.priceCents} > 0`),
    check(
      "products_active_has_price",
      sql`${t.status} <> 'active' OR ${t.priceCents} IS NOT NULL`,
    ),
    check(
      "products_compare_at_gt_price",
      sql`${t.compareAtCents} IS NULL OR ${t.priceCents} IS NULL OR ${t.compareAtCents} > ${t.priceCents}`,
    ),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    /** Cor que a foto representa (para trocar galeria ao escolher cor) */
    colorId: uuid("color_id").references(() => colors.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    colorId: uuid("color_id").references(() => colors.id, { onDelete: "restrict" }),
    sizeId: uuid("size_id").references(() => sizes.id, { onDelete: "restrict" }),
    sku: text("sku").notNull().unique(),
    stock: integer("stock").notNull().default(0),
    /** Preço específico da variação (opcional). */
    priceCents: integer("price_cents"),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("product_variants_combo_uq").on(t.productId, t.colorId, t.sizeId).nullsNotDistinct(),
    index("product_variants_product_idx").on(t.productId),
    check("product_variants_stock_nonneg", sql`${t.stock} >= 0`),
    check("product_variants_price_positive", sql`${t.priceCents} IS NULL OR ${t.priceCents} > 0`),
  ],
);

/* -------------------------------- Clientes -------------------------------- */

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  /** CPF só é coletado porque é exigido para emissão de nota fiscal e antifraude do pagamento. */
  cpf: text("cpf"),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  marketingConsentAt: timestamp("marketing_consent_at", { withTimezone: true }),
  anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    cep: text("cep").notNull(),
    street: text("street").notNull(),
    number: text("number").notNull(),
    complement: text("complement"),
    district: text("district").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("addresses_customer_idx").on(t.customerId)],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  source: text("source"),
  consentText: text("consent_text").notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
});

/* -------------------------------- Carrinho -------------------------------- */

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** SHA-256 do token guardado em cookie HttpOnly */
  tokenHash: text("token_hash").notNull().unique(),
  couponCode: text("coupon_code"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.cartId, t.variantId] }),
    check("cart_items_qty", sql`${t.quantity} > 0 AND ${t.quantity} <= 20`),
  ],
);

/* ------------------------------ Frete e cupons ----------------------------- */

export const shippingMethods = pgTable("shipping_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: shippingType("type").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  /** Frete grátis a partir deste subtotal (centavos). Nulo = nunca. */
  freeAboveCents: integer("free_above_cents"),
  /** Faixas de CEP atendidas: "78550000-78559999, 78560000-78560999". Vazio = qualquer CEP. */
  cepRanges: text("cep_ranges"),
  eta: text("eta"),
  active: boolean("active").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [check("shipping_price_nonneg", sql`${t.priceCents} >= 0`)]);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    description: text("description"),
    type: couponType("type").notNull(),
    /** percent: 1–100 · fixed: centavos · free_shipping: ignorado */
    value: integer("value").notNull().default(0),
    minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("coupons_value_nonneg", sql`${t.value} >= 0`),
    check("coupons_percent_range", sql`${t.type} <> 'percent' OR (${t.value} BETWEEN 1 AND 100)`),
    check("coupons_used_nonneg", sql`${t.usedCount} >= 0`),
  ],
);

/* --------------------------------- Pedidos -------------------------------- */

export type AddressSnapshot = {
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
};

export type ShippingSnapshot = {
  methodId: string;
  name: string;
  type: "pickup" | "local_delivery" | "shipping";
  eta?: string | null;
  priceCents: number;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: integer("number").generatedAlwaysAsIdentity({ startWith: 1001 }).notNull().unique(),
    /** Token público (URL da página do pedido para a cliente) */
    publicToken: text("public_token").notNull().unique(),
    /** Evita pedidos duplicados por clique duplo/reenvio do formulário */
    idempotencyKey: text("idempotency_key").notNull().unique(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    status: orderStatus("status").notNull().default("pending_payment"),
    paymentStatus: paymentStatus("payment_status").notNull().default("none"),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerCpf: text("customer_cpf"),
    address: jsonb("address").$type<AddressSnapshot | null>(),
    shipping: jsonb("shipping").$type<ShippingSnapshot>().notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    couponCode: text("coupon_code"),
    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    notes: text("notes"),
    trackingCode: text("tracking_code"),
    trackingUrl: text("tracking_url"),
    mpPreferenceId: text("mp_preference_id"),
    mpInitPoint: text("mp_init_point"),
    /** Estoque está reservado para este pedido? */
    stockReserved: boolean("stock_reserved").notNull().default(false),
    couponCounted: boolean("coupon_counted").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    confirmationEmailSentAt: timestamp("confirmation_email_sent_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    index("orders_customer_idx").on(t.customerId),
    check(
      "orders_totals_consistent",
      sql`${t.totalCents} = ${t.subtotalCents} - ${t.discountCents} + ${t.shippingCents}`,
    ),
    check("orders_total_positive", sql`${t.totalCents} > 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    variantLabel: text("variant_label"),
    sku: text("sku").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    mediaKey: text("media_key"),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    check("order_items_qty", sql`${t.quantity} > 0`),
  ],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: serial("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    message: text("message").notNull(),
    actor: text("actor").notNull().default("sistema"),
    createdAt: createdAt(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("mercadopago"),
    providerPaymentId: text("provider_payment_id").notNull(),
    status: paymentStatus("status").notNull(),
    statusDetail: text("status_detail"),
    paymentTypeId: text("payment_type_id"),
    paymentMethodId: text("payment_method_id"),
    installments: integer("installments"),
    amountCents: integer("amount_cents").notNull(),
    refundedCents: integer("refunded_cents").notNull().default(0),
    /** Data em que o provedor atualizou por último (para ignorar notificações antigas) */
    providerUpdatedAt: timestamp("provider_updated_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("payments_provider_uq").on(t.provider, t.providerPaymentId),
    index("payments_order_idx").on(t.orderId),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull(),
    requestId: text("request_id"),
    topic: text("topic"),
    resourceId: text("resource_id"),
    signatureValid: boolean("signature_valid").notNull(),
    status: text("status").notNull().default("received"),
    error: text("error"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [index("webhook_events_resource_idx").on(t.resourceId), index("webhook_events_received_idx").on(t.receivedAt)],
);

/* --------------------------- Conteúdo e configurações --------------------------- */

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  placement: bannerPlacement("placement").notNull(),
  eyebrow: text("eyebrow"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  ctaLabel: text("cta_label"),
  ctaHref: text("cta_href"),
  mediaId: uuid("media_id").references(() => media.id, { onDelete: "set null" }),
  secondaryMediaId: uuid("secondary_media_id").references(() => media.id, { onDelete: "set null" }),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const pages = pgTable("pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  /** Markdown simples (títulos, listas, negrito, links). HTML é escapado. */
  body: text("body").notNull(),
  seoDescription: text("seo_description"),
  published: boolean("published").notNull().default(true),
  updatedAt: updatedAt(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
});

/* -------------------------------- Relações -------------------------------- */

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(productVariants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  media: one(media, { fields: [productImages.mediaId], references: [media.id] }),
  color: one(colors, { fields: [productImages.colorId], references: [colors.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  color: one(colors, { fields: [productVariants.colorId], references: [colors.id] }),
  size: one(sizes, { fields: [productVariants.sizeId], references: [sizes.id] }),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  image: one(media, { fields: [categories.imageId], references: [media.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  events: many(orderEvents),
  payments: many(payments),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
}));
export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
}));
export const cartsRelations = relations(carts, ({ many }) => ({ items: many(cartItems) }));
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));
export const bannersRelations = relations(banners, ({ one }) => ({
  media: one(media, { fields: [banners.mediaId], references: [media.id] }),
  secondaryMedia: one(media, { fields: [banners.secondaryMediaId], references: [media.id] }),
}));
