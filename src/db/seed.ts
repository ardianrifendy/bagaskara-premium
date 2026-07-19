import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as bcrypt from "bcryptjs";
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

  const prodNetflix = insertedProducts.find((p) => p.slug === "netflix-4k")!.id;
  const prodDisney = insertedProducts.find((p) => p.slug === "disney-hotstar")!.id;
  const prodSpotify = insertedProducts.find((p) => p.slug === "spotify-premium")!.id;
  const prodYoutube = insertedProducts.find((p) => p.slug === "youtube-premium")!.id;
  const prodCanva = insertedProducts.find((p) => p.slug === "canva-pro")!.id;
  const prodCapcut = insertedProducts.find((p) => p.slug === "capcut-pro")!.id;
  const prodChatgpt = insertedProducts.find((p) => p.slug === "chatgpt-plus")!.id;

  // 4. Insert Variants
  console.log("Seeding variants...");
  const insertedVariants = await db
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

  // Find variant IDs for stock seeding
  const netflix1mVar = insertedVariants.find(
    (v) => v.productId === prodNetflix && v.name === "1 Bulan Shared"
  )!.id;
  const disney1mVar = insertedVariants.find(
    (v) => v.productId === prodDisney && v.name === "1 Bulan Shared"
  )!.id;
  const spotify1mVar = insertedVariants.find(
    (v) => v.productId === prodSpotify && v.name === "1 Bulan Individual"
  )!.id;
  const canva1mVar = insertedVariants.find(
    (v) => v.productId === prodCanva && v.name === "1 Bulan Premium Member"
  )!.id;
  const chatgpt1mVar = insertedVariants.find(
    (v) => v.productId === prodChatgpt && v.name === "1 Bulan Shared"
  )!.id;

  // 5. Insert Stock Items
  console.log("Seeding stock items...");
  const stockToInsert = [
    // Netflix 1M Shared
    ...Array.from({ length: 5 }).map((_, i) => ({
      variantId: netflix1mVar,
      payloadJson: {
        email: `netflix-shared-${i + 1}@bagaskara.store`,
        password: `NetPassWord${i + 1}!`,
        profile: `Profil ${i + 1}`,
        pin: `100${i + 1}`,
        note: "Gunakan profil Anda sendiri. Dilarang mengubah password/pin.",
      },
      status: "AVAILABLE" as const,
    })),
    // Disney+ 1M Shared
    ...Array.from({ length: 3 }).map((_, i) => ({
      variantId: disney1mVar,
      payloadJson: {
        email: `disney-shared-${i + 1}@bagaskara.store`,
        password: `DisneyPass${i + 1}!`,
        profile: `Profil ${i + 1}`,
        pin: `200${i + 1}`,
        note: "Silakan gunakan profil yang ditentukan. Dilarang edit profil lain.",
      },
      status: "AVAILABLE" as const,
    })),
    // Spotify 1M Individual
    ...Array.from({ length: 5 }).map((_, i) => ({
      variantId: spotify1mVar,
      payloadJson: {
        email: `spotify-indiv-${i + 1}@bagaskara.store`,
        password: `SpotPass-${i + 1}#`,
        profile: "-",
        pin: "-",
        note: "Akun individual personal. Garansi penuh 30 hari.",
      },
      status: "AVAILABLE" as const,
    })),
    // Canva 1M Premium
    ...Array.from({ length: 4 }).map((_, i) => ({
      variantId: canva1mVar,
      payloadJson: {
        email: `canva-prem-${i + 1}@bagaskara.store`,
        password: `CanvaPassWord${i + 1}`,
        profile: "-",
        pin: "-",
        note: "Akses login via email & password, atau gunakan link invite di profil admin.",
      },
      status: "AVAILABLE" as const,
    })),
    // ChatGPT Plus Shared
    ...Array.from({ length: 3 }).map((_, i) => ({
      variantId: chatgpt1mVar,
      payloadJson: {
        email: `chatgpt-shared-${i + 1}@bagaskara.store`,
        password: `GPTplusPass${i + 1}!`,
        profile: `User-${i + 1}`,
        pin: "-",
        note: "Gunakan secukupnya, dilarang mengubah password atau menghapus chat history orang lain.",
      },
      status: "AVAILABLE" as const,
    })),
  ];

  await db.insert(schema.stockItems).values(stockToInsert);

  // 6. Insert Admins
  console.log("Seeding admin account...");
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const passwordToHash = "bagaskara123";
  const salt = bcrypt.genSaltSync(12);
  const passwordHash = bcrypt.hashSync(passwordToHash, salt);

  await db.insert(schema.admins).values({
    username: adminUsername,
    passwordHash: passwordHash,
  });

  // 7. Insert Settings
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
  console.log(`Admin account created -> Username: ${adminUsername} | Password: ${passwordToHash}`);
  console.log("-----------------------------------------");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed with error:", error);
  process.exit(1);
});
