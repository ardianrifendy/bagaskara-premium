import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

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

  // 1. Clear existing contents
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
  const insertedProducts = await db
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
        badge: "HOT",
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
        tagline: "Akses GPT-4o & DALL-E tanpa batas",
        description: "Dapatkan respon lebih cepat, akses model terpintar GPT-4o, dan analisis data instan.",
        badge: "SMART",
        sortOrder: 7,
      },
      {
        categoryId: catApps,
        name: "Claude Pro AI",
        slug: "claude-pro",
        tagline: "AI Cerdas untuk Coding & Penulisan Dokumen",
        description: "Akses Claude 3.5 Sonnet dengan konteks panjang dan performa analisis terbaik.",
        badge: "HOT",
        sortOrder: 8,
      },
      {
        categoryId: catApps,
        name: "Microsoft Office 365",
        slug: "office-365",
        tagline: "Word, Excel, PowerPoint & OneDrive 1TB",
        description: "Lisensi resmi Microsoft 365 Plus 1 Tahun lengkap dengan penyimpanan cloud OneDrive 1TB.",
        badge: null,
        sortOrder: 9,
      },
      {
        categoryId: catDesain,
        name: "Adobe Express 12M",
        slug: "adobe-express",
        tagline: "Desain grafis & edit foto kilat dari Adobe",
        description: "Akses ribuan template premium Adobe Express dan aset foto/vektor Adobe Stock.",
        badge: null,
        sortOrder: 10,
      },
      {
        categoryId: catStreaming,
        name: "Viu Premium",
        slug: "viu-premium",
        tagline: "Nonton Drama Korea & Asia Terlengkap",
        description: "Streaming drakor terbaru dan variety show Asia dengan subtitle Indonesia tanpa iklan.",
        badge: null,
        sortOrder: 11,
      },
      {
        categoryId: catApps,
        name: "Grammarly Premium",
        slug: "grammarly-premium",
        tagline: "Pemeriksa Tata Bahasa & Plagiarisme",
        description: "Perbaiki tata bahasa Inggris, nada tulisan, dan cek plagiarisme secara profesional.",
        badge: null,
        sortOrder: 12,
      },
      {
        categoryId: catApps,
        name: "iCloud Mail & Storage",
        slug: "icloud-storage",
        tagline: "Storage Tambahan & Email Custom Apple",
        description: "Akses penyimpanan cloud Apple dan layanan email iCloud resmi.",
        badge: null,
        sortOrder: 13,
      },
      {
        categoryId: catApps,
        name: "Coursera Plus",
        slug: "coursera-plus",
        tagline: "Akses Ribuan Kursus & Sertifikat Resmi",
        description: "Belajar skill baru dari universitas terkemuka dunia dengan akses sertifikat gratis.",
        badge: null,
        sortOrder: 14,
      },
      {
        categoryId: catApps,
        name: "Google Gemini Advanced",
        slug: "gemini-pro",
        tagline: "AI Terbaru dari Google dengan 1.5 Pro Model",
        description: "Akses Gemini Advanced 1.5 Pro dengan konteks 1M token dan integrasi Google Workspace.",
        badge: "HOT",
        sortOrder: 15,
      },
      {
        categoryId: catApps,
        name: "Notion Plus 12M",
        slug: "notion-plus",
        tagline: "Workspace Produktivitas & Catatan AI",
        description: "Akses Notion Plus tanpa batas untuk catatan, manajemen proyek, dan database AI.",
        badge: null,
        sortOrder: 16,
      },
      {
        categoryId: catApps,
        name: "Emails Outlook / Hotmail",
        slug: "emails-outlook",
        tagline: "Akun Email Microsoft Outlook Fresh Ready",
        description: "Akun email Outlook / Hotmail fresh terverifikasi untuk kebutuhan pendaftaran & bisnis.",
        badge: "AUTO",
        sortOrder: 17,
      },
    ])
    .returning();

  // 4. Insert Variants
  console.log("Seeding variants...");
  const findId = (slug: string) => insertedProducts.find((p) => p.slug === slug)!.id;

  await db.insert(schema.variants).values([
    // Netflix
    { productId: findId("netflix-4k"), name: "1 Bulan Shared", durationDays: 30, price: 30000, comparePrice: 45000, deliveryMode: "AUTO_STOCK", warrantyDays: 30 },
    { productId: findId("netflix-4k"), name: "3 Bulan Shared", durationDays: 90, price: 85000, comparePrice: 120000, deliveryMode: "AUTO_STOCK", warrantyDays: 90 },

    // Disney+
    { productId: findId("disney-hotstar"), name: "1 Bulan Shared", durationDays: 30, price: 25000, comparePrice: 39000, deliveryMode: "AUTO_STOCK", warrantyDays: 30 },

    // Spotify
    { productId: findId("spotify-premium"), name: "1 Bulan Individual", durationDays: 30, price: 20000, comparePrice: 35000, deliveryMode: "AUTO_STOCK", warrantyDays: 30 },
    { productId: findId("spotify-premium"), name: "3 Bulan Individual", durationDays: 90, price: 55000, comparePrice: 99000, deliveryMode: "AUTO_STOCK", warrantyDays: 90 },

    // YouTube
    { productId: findId("youtube-premium"), name: "1 Bulan Family Member", durationDays: 30, price: 15000, comparePrice: 25000, deliveryMode: "AUTO_STOCK", warrantyDays: 30 },

    // Canva
    { productId: findId("canva-pro"), name: "1 Bulan Premium Member", durationDays: 30, price: 10000, comparePrice: 20000, deliveryMode: "AUTO_STOCK", warrantyDays: 30 },
    { productId: findId("canva-pro"), name: "1 Tahun Admin Invite", durationDays: 365, price: 45000, comparePrice: 150000, deliveryMode: "PROVIDER_API", supplierProductId: "6a2fdb4f035a6d898f2106ff", warrantyDays: 365 },

    // CapCut
    { productId: findId("capcut-pro"), name: "1 Bulan Premium", durationDays: 30, price: 20000, comparePrice: 35000, deliveryMode: "PROVIDER_API", supplierProductId: "6a2fda51035a6d898f2106fe", warrantyDays: 30 },

    // ChatGPT
    { productId: findId("chatgpt-plus"), name: "1 Bulan Shared", durationDays: 30, price: 90000, comparePrice: 150000, deliveryMode: "AUTO_STOCK", warrantyDays: 30 },

    // Claude
    { productId: findId("claude-pro"), name: "1 Bulan Pro Member", durationDays: 30, price: 85000, comparePrice: 160000, deliveryMode: "AUTO_STOCK", warrantyDays: 30 },

    // Office 365
    { productId: findId("office-365"), name: "1 Tahun Full Access + 1TB", durationDays: 365, price: 35000, comparePrice: 120000, deliveryMode: "PROVIDER_API", supplierProductId: "6a2fe23a1c8697b163aedcbd", warrantyDays: 365 },

    // Adobe Express
    { productId: findId("adobe-express"), name: "1 Tahun Full Access", durationDays: 365, price: 40000, comparePrice: 180000, deliveryMode: "PROVIDER_API", supplierProductId: "6a5b873847b60c66fc160b2", warrantyDays: 365 },

    // Viu
    { productId: findId("viu-premium"), name: "3 Bulan Premium", durationDays: 90, price: 18000, comparePrice: 35000, deliveryMode: "AUTO_STOCK", warrantyDays: 90 },

    // Grammarly
    { productId: findId("grammarly-premium"), name: "1 Bulan Individual", durationDays: 30, price: 25000, comparePrice: 60000, deliveryMode: "AUTO_STOCK", warrantyDays: 30 },

    // iCloud
    { productId: findId("icloud-storage"), name: "1 Bulan Storage Mail", durationDays: 30, price: 12000, comparePrice: 25000, deliveryMode: "PROVIDER_API", supplierProductId: "6a554c34351561c645a46872", warrantyDays: 30 },

    // Coursera
    { productId: findId("coursera-plus"), name: "1 Tahun Full Access", durationDays: 365, price: 95000, comparePrice: 400000, deliveryMode: "PROVIDER_API", supplierProductId: "6a3136d8ccc64c91167242c3", warrantyDays: 365 },

    // Gemini
    { productId: findId("gemini-pro"), name: "18 Bulan Link Direct", durationDays: 540, price: 45000, comparePrice: 150000, deliveryMode: "PROVIDER_API", supplierProductId: "6a2fdb4f035a6d898f2106fg", warrantyDays: 180 },

    // Notion
    { productId: findId("notion-plus"), name: "12 Bulan Plus Member", durationDays: 365, price: 50000, comparePrice: 180000, deliveryMode: "AUTO_STOCK", warrantyDays: 365 },

    // Emails Outlook
    { productId: findId("emails-outlook"), name: "1x Akun Outlook Fresh", durationDays: 365, price: 2000, comparePrice: 5000, deliveryMode: "AUTO_STOCK", warrantyDays: 30 },
  ]);

  // 5. Insert Settings
  console.log("Seeding settings...");
  await db.insert(schema.settings).values([
    { key: "cs_whatsapp", value: "6289513679939" },
    {
      key: "warranty_text",
      value: "Garansi mencakup: akun tidak premium, salah password, profile bermasalah. Garansi tidak berlaku apabila Anda merubah password atau detail akun.",
    },
    { key: "social_proof_enabled", value: "true" },
    {
      key: "static_qris",
      value: "00020101021126610014COM.GO-JEK.WWW01189360091431482851640210G1482851640303UMI51440014ID.CO.QRIS.WWW0215ID10254032776980303UMI5204573253033605802ID5914Bagaskara Cell6006GRESIK61056117162070703A0163040A9C",
    },
  ]);

  console.log("-----------------------------------------");
  console.log("Database seeded successfully!");
  console.log("14 Produk & varian lengkap dengan ikon SVG telah dimasukkan.");
  console.log("-----------------------------------------");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed with error:", error);
  process.exit(1);
});
