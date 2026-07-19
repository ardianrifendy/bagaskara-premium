import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Load environment variables like Next.js does
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

async function seed() {
  console.log("Starting database seeding...");

  const sql = neon(databaseUrl!);
  const db = drizzle(sql, { schema });

  // 1. Clear existing database contents (optional but helpful for clean seed)
  console.log("Clearing existing tables...");
  await db.delete(schema.deliveries);
  await db.delete(schema.stockItems);
  await db.delete(schema.orders);
  await db.delete(schema.variants);
  await db.delete(schema.products);
  await db.delete(schema.categories);
  await db.delete(schema.admins);
  await db.delete(schema.settings);

  // 2. Insert Categories
  console.log("Seeding categories...");
  const insertedCategories = await db
    .insert(schema.categories)
    .values([
      { name: "Desain & Edit", slug: "desain-edit", accentColor: "emerald", sortOrder: 1 },
      { name: "Streaming & Media", slug: "streaming-media", accentColor: "amber", sortOrder: 2 },
      { name: "Musik", slug: "musik", accentColor: "rose", sortOrder: 3 },
      { name: "Apps & Tools", slug: "apps-tools", accentColor: "blue", sortOrder: 4 },
    ])
    .returning();

  const catDesain = insertedCategories.find((c) => c.slug === "desain-edit")!.id;
  const catStreaming = insertedCategories.find((c) => c.slug === "streaming-media")!.id;
  const catMusik = insertedCategories.find((c) => c.slug === "musik")!.id;
  const catApps = insertedCategories.find((c) => c.slug === "apps-tools")!.id;

  // 3. Insert Products
  console.log("Seeding products...");
  await db
    .insert(schema.products)
    .values([
      {
        categoryId: catStreaming,
        name: "Netflix 4K Premium",
        slug: "netflix-4k",
        tagline: "Stream film & serial TV resolusi UHD 4K",
        description: "Nonton Netflix kualitas Ultra HD 4K di HP, tablet, laptop, atau TV Anda. Akun premium siap pakai.",
        badge: "HOT",
        sortOrder: 1,
      },
      {
        categoryId: catStreaming,
        name: "Disney+ Hotstar",
        slug: "disney-hotstar",
        tagline: "Streaming film Marvel, Disney, Pixar, dll",
        description: "Nikmati streaming film terpopuler Disney+, Marvel, Star Wars dengan kualitas terbaik.",
        badge: null,
        sortOrder: 2,
      },
      {
        categoryId: catMusik,
        name: "Spotify Premium",
        slug: "spotify-premium",
        tagline: "Musik tanpa iklan & bisa didownload",
        description: "Dengarkan jutaan lagu tanpa iklan, kualitas audio tinggi, dan bisa diputar offline.",
        badge: "AUTO",
        sortOrder: 3,
      },
      {
        categoryId: catMusik,
        name: "YouTube Premium",
        slug: "youtube-premium",
        tagline: "Nonton YouTube tanpa jeda iklan",
        description: "Nikmati konten YouTube dan YouTube Music tanpa iklan, bisa diputar di background dan offline.",
        badge: null,
        sortOrder: 4,
      },
      {
        categoryId: catDesain,
        name: "Canva Pro",
        slug: "canva-pro",
        tagline: "Akses jutaan template & elemen premium",
        description: "Desain apa saja dengan mudah menggunakan fitur Canva Pro, hapus background, template premium, dll.",
        badge: null,
        sortOrder: 5,
      },
      {
        categoryId: catDesain,
        name: "CapCut Pro",
        slug: "capcut-pro",
        tagline: "Edit video profesional tanpa watermark",
        description: "Akses efek premium, transisi, dan filter profesional di CapCut Pro tanpa iklan dan watermark.",
        badge: null,
        sortOrder: 6,
      },
      {
        categoryId: catApps,
        name: "ChatGPT Plus",
        slug: "chatgpt-plus",
        tagline: "Akses GPT-4o tanpa batas kuota gratis",
        description: "Dapatkan respon lebih cepat, akses model terpintar GPT-4o, dan fitur tambahan ChatGPT Plus.",
        badge: "SMART",
        sortOrder: 7,
      },
    ])
    .returning();

  // 4. Insert Variants (tanpa stok — stok diisi manual via admin panel)
  console.log("Seeding variants...");

  // Ambil product IDs
  const allProducts = await db.select().from(schema.products);
  const prodNetflix = allProducts.find((p) => p.slug === "netflix-4k")!.id;
  const prodDisney = allProducts.find((p) => p.slug === "disney-hotstar")!.id;
  const prodSpotify = allProducts.find((p) => p.slug === "spotify-premium")!.id;
  const prodYoutube = allProducts.find((p) => p.slug === "youtube-premium")!.id;
  const prodCanva = allProducts.find((p) => p.slug === "canva-pro")!.id;
  const prodCapcut = allProducts.find((p) => p.slug === "capcut-pro")!.id;
  const prodChatgpt = allProducts.find((p) => p.slug === "chatgpt-plus")!.id;

  await db
    .insert(schema.variants)
    .values([
      // Netflix
      {
        productId: prodNetflix,
        name: "1 Bulan Shared",
        durationDays: 30,
        price: 30000,
        comparePrice: 45000,
        deliveryMode: "AUTO_STOCK",
        warrantyDays: 30,
      },
      {
        productId: prodNetflix,
        name: "3 Bulan Shared",
        durationDays: 90,
        price: 85000,
        comparePrice: 120000,
        deliveryMode: "AUTO_STOCK",
        warrantyDays: 90,
      },
      // Disney+
      {
        productId: prodDisney,
        name: "1 Bulan Shared",
        durationDays: 30,
        price: 25000,
        comparePrice: 39000,
        deliveryMode: "AUTO_STOCK",
        warrantyDays: 30,
      },
      // Spotify
      {
        productId: prodSpotify,
        name: "1 Bulan Individual",
        durationDays: 30,
        price: 20000,
        comparePrice: 35000,
        deliveryMode: "AUTO_STOCK",
        warrantyDays: 30,
      },
      {
        productId: prodSpotify,
        name: "3 Bulan Individual",
        durationDays: 90,
        price: 55000,
        comparePrice: 99000,
        deliveryMode: "AUTO_STOCK",
        warrantyDays: 90,
      },
      // YouTube
      {
        productId: prodYoutube,
        name: "1 Bulan Family Member",
        durationDays: 30,
        price: 15000,
        comparePrice: 25000,
        deliveryMode: "AUTO_STOCK",
        warrantyDays: 30,
      },
      // Canva
      {
        productId: prodCanva,
        name: "1 Bulan Premium Member",
        durationDays: 30,
        price: 10000,
        comparePrice: 20000,
        deliveryMode: "AUTO_STOCK",
        warrantyDays: 30,
      },
      // CapCut
      {
        productId: prodCapcut,
        name: "1 Bulan Premium",
        durationDays: 30,
        price: 20000,
        comparePrice: 35000,
        deliveryMode: "AUTO_STOCK",
        warrantyDays: 30,
      },
      // ChatGPT
      {
        productId: prodChatgpt,
        name: "1 Bulan Shared",
        durationDays: 30,
        price: 90000,
        comparePrice: 150000,
        deliveryMode: "AUTO_STOCK",
        warrantyDays: 30,
      },
    ])
    .returning();

  // NOTE: Tidak ada stok seed — stok akun diisi manual via Admin Panel (/admin/stok).
  // NOTE: Tidak ada admin seed — login admin menggunakan env ADMIN_USERNAME + ADMIN_PASSWORD_HASH.

  // 5. Insert Settings
  console.log("Seeding settings...");
  await db.insert(schema.settings).values([
    { key: "cs_whatsapp", value: "628123456789" },
    {
      key: "warranty_text",
      value: "Garansi mencakup: akun tidak premium, salah password, profile bermasalah. Garansi tidak berlaku apabila Anda merubah password atau detail akun.",
    },
    { key: "social_proof_enabled", value: "true" },
  ]);

  console.log("-----------------------------------------");
  console.log("Database seeded successfully!");
  console.log("Kategori, produk, dan varian telah diisi.");
  console.log("Stok akun: KOSONG (isi manual via Admin Panel).");
  console.log("Admin login: gunakan env ADMIN_USERNAME + ADMIN_PASSWORD_HASH.");
  console.log("-----------------------------------------");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed with error:", error);
  process.exit(1);
});
