import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

const updates = [
  {
    slug: "gemini-pro",
    tagline: "AI Terbaru Google dengan Gemini 3.5 & 2.0 Ultra",
    description: "Akses Google Gemini Advanced model Gemini 3.5 & 2.0 Ultra dengan penalaran multimodal canggih, 2M+ token konteks, dan integrasi Google Workspace.",
  },
  {
    slug: "chatgpt-plus",
    tagline: "Akses GPT-4o, GPT-o1 & DALL-E 3 Tanpa Batas",
    description: "Dapatkan respon tercepat, akses model nalar GPT-o1, GPT-4o, analisis data instan, dan pembuatan gambar DALL-E 3.",
  },
  {
    slug: "claude-pro",
    tagline: "AI Terpintar untuk Coding & Dokumen",
    description: "Akses Claude 3.5 Sonnet & Claude 3.5 Haiku dengan 200k+ token konteks, pemrosesan artefak, dan analisa kode super cepat.",
  },
  {
    slug: "canva-pro",
    tagline: "Akses Jutaan Template & Fitur Magic AI",
    description: "Desain profesional dengan Magic Edit AI, hapus background instan, brand kit, dan jutaan aset premium tanpa batas.",
  },
  {
    slug: "capcut-pro",
    tagline: "Edit Video AI Tanpa Watermark 4K",
    description: "Akses efek visual AI premium, auto-caption, transisi pro, dan ekspor 4K di CapCut Pro tanpa watermark.",
  },
  {
    slug: "office-365",
    tagline: "Word, Excel, PowerPoint & Copilot AI 1TB",
    description: "Lisensi resmi Microsoft 365 Plus 1 Tahun lengkap dengan penyimpanan cloud OneDrive 1TB & integrasi Copilot AI.",
  },
  {
    slug: "netflix-4k",
    tagline: "Stream Film & Serial TV Ultra HD 4K",
    description: "Nonton Netflix kualitas Ultra HD 4K HDR di HP, tablet, laptop, atau TV Anda. Bebas hambatan, akun premium siap pakai.",
  },
  {
    slug: "disney-hotstar",
    tagline: "Streaming Marvel, Disney & Bioskop IMAX",
    description: "Nikmati film terpopuler Disney+, Marvel Cinematic Universe, Star Wars, Pixar, dan film bioskop berkualitas tinggi.",
  },
  {
    slug: "spotify-premium",
    tagline: "Musik Bebas Iklan & Audio Lossless HQ",
    description: "Dengarkan jutaan lagu tanpa iklan, kualitas audio sangat tinggi, download offline, dan lirik real-time.",
  },
  {
    slug: "youtube-premium",
    tagline: "Nonton Tanpa Iklan + YouTube Music HQ",
    description: "Nikmati konten YouTube dan YouTube Music tanpa jeda iklan, bisa diputar background layar mati dan download offline.",
  },
  {
    slug: "adobe-express",
    tagline: "Desain Grafis & Generative AI Firefly",
    description: "Akses ribuan template premium Adobe Express, fitur Generative AI Firefly, dan aset foto/vektor Adobe Stock.",
  },
  {
    slug: "grammarly-premium",
    tagline: "Pemeriksa Tata Bahasa & Plagiarisme AI",
    description: "Perbaiki tata bahasa Inggris, nada tulisan, penulisan AI, dan cek plagiarisme secara profesional.",
  },
  {
    slug: "notion-plus",
    tagline: "Workspace Catatan, Proyek & Notion AI",
    description: "Akses Notion Plus tanpa batas untuk catatan, manajemen proyek, database, dan Notion AI cerdas.",
  },
];

async function run() {
  console.log("Updating product descriptions in Neon database...");
  const sql = neon(databaseUrl!);
  const db = drizzle(sql, { schema });

  for (const u of updates) {
    const res = await db
      .update(schema.products)
      .set({
        tagline: u.tagline,
        description: u.description,
      })
      .where(eq(schema.products.slug, u.slug));
    console.log(`Updated product: ${u.slug}`);
  }

  console.log("Successfully updated all product descriptions!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to update product descriptions:", err);
  process.exit(1);
});
