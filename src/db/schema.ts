import { pgTable, serial, text, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const badgeEnum = pgEnum("product_badge", ["HOT", "AUTO", "SMART"]);
export const deliveryModeEnum = pgEnum("delivery_mode", ["AUTO_STOCK", "MANUAL_INVITE", "PROVIDER_API"]);
export const stockStatusEnum = pgEnum("stock_status", ["AVAILABLE", "SOLD", "PROBLEM"]);
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "PAID",
  "PROCESSING",
  "DELIVERED",
  "EXPIRED",
  "FAILED",
  "REFUNDED",
]);

// Tables
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  accentColor: text("accent_color").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  badge: badgeEnum("badge"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const variants = pgTable("variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  durationDays: integer("duration_days").notNull(),
  price: integer("price").notNull(),
  comparePrice: integer("compare_price"),
  resellerPrice: integer("reseller_price"),
  deliveryMode: deliveryModeEnum("delivery_mode").notNull(),
  supplierProductId: text("supplier_product_id"),
  warrantyDays: integer("warranty_days").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(), // e.g. BGS-XXXXXXXX
  variantId: integer("variant_id")
    .references(() => variants.id)
    .notNull(),
  productNameSnap: text("product_name_snap").notNull(),
  variantNameSnap: text("variant_name_snap").notNull(),
  price: integer("price").notNull(),
  waNumber: text("wa_number").notNull(),
  email: text("email").notNull(),
  note: text("note"),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  statusChangedBy: text("status_changed_by"), // 'webhook' | 'cron' | 'admin:<username>'
  statusChangedAt: timestamp("status_changed_at"),
  paymentRef: text("payment_ref").notNull(),
  paymentQrUrl: text("payment_qr_url").notNull(),
  expiredAt: timestamp("expired_at").notNull(),
  paidAt: timestamp("paid_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockItems = pgTable("stock_items", {
  id: serial("id").primaryKey(),
  variantId: integer("variant_id")
    .references(() => variants.id, { onDelete: "cascade" })
    .notNull(),
  payloadJson: jsonb("payload_json").notNull(), // {email, password, profile, pin, note}
  status: stockStatusEnum("status").default("AVAILABLE").notNull(),
  soldOrderId: text("sold_order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: text("order_id")
    .references(() => orders.id)
    .unique()
    .notNull(),
  payloadJson: jsonb("payload_json").notNull(), // Snapshot of stock_items payloadJson
  warrantyUntil: timestamp("warranty_until").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(variants),
}));

export const variantsRelations = relations(variants, ({ one, many }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
  stockItems: many(stockItems),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  variant: one(variants, {
    fields: [orders.variantId],
    references: [variants.id],
  }),
  delivery: one(deliveries, {
    fields: [orders.id],
    references: [deliveries.orderId],
  }),
  stockItems: many(stockItems),
}));

export const stockItemsRelations = relations(stockItems, ({ one }) => ({
  variant: one(variants, {
    fields: [stockItems.variantId],
    references: [variants.id],
  }),
  soldOrder: one(orders, {
    fields: [stockItems.soldOrderId],
    references: [orders.id],
  }),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
}));
