# agents.md — Pembagian Tugas Multi-Agent

Kerjakan berurutan A1 → A6, tunduk pada RULES EKSEKUSI di `CLAUDE.md`.

**Protokol wajib setiap agent:**

1. Baca `CLAUDE.md` + bagian `implementation.md` yang relevan.
2. Pecah pekerjaan ke SUB-AGENT (Task tool) untuk bagian yang independen; kerjakan paralel bila memungkinkan.
3. Zero-error gate: `tsc --noEmit` → `npm run lint` → `npm run build` harus bersih.
4. Tutup dengan sub-agent AUDITOR → tulis hasil ke `AUDIT.md`. Status LULUS = syarat agent berikutnya boleh mulai.
5. Selalu tulis kode lengkap satu file penuh.

**Contoh pembagian sub-agent:** A2 → sub-agent Navbar+Theme, sub-agent Hero+Search, sub-agent Grid+Card, sub-agent SocialProof, lalu sub-agent AUDITOR. A3 → sub-agent Tripay lib, sub-agent halaman produk+server action, sub-agent webhook+cron, sub-agent tes idempotency, lalu AUDITOR.

---

## A1 — Foundation & Schema Agent

**Scope:** inisialisasi proyek + database.

1. Init Next.js 14 App Router + TypeScript strict + Tailwind (`darkMode: "class"`) + Plus Jakarta Sans via `next/font`. `git init` + `.gitignore` (wajib berisi `.env*` kecuali `.env.example`, `node_modules`, `.next`) + commit awal.
2. Setup Drizzle + Neon: `src/db/schema.ts` lengkap sesuai implementation.md §3, `src/db/index.ts`, script `db:generate`, `db:migrate`, `db:seed`.
3. `src/lib/format.ts` (rupiah `id-ID`, tanggal, samarkan nomor WA `62xx••••86`).
4. `.env.example` lengkap.
5. Seed data §8 (ikon = komponen `ProductIcon` inisial berwarna, tanpa aset pihak ketiga).

**Output:** proyek build lolos, migrasi jalan, seed masuk.

---

## A2 — UI Foundation & Landing Agent

**Scope:** design system + halaman publik utama. Bergantung: A1.

1. Root layout: baca cookie `theme` → class `dark` di `<html>` tanpa flash; `ThemeToggle` client component (set cookie + toggle class).
2. Komponen bersama: `Navbar` (sticky blur, logo, Pricelist, toggle, Login pill), `Footer`, `Badge`, `CategoryPill`, `ProductCard`, `ProductIcon`, `SearchInvoiceBar`.
3. Landing `/` sesuai implementation.md §2.2 lengkap: hero, search+cek invoice, filter kategori client-side, grid produk dari DB, social proof toast (route handler `GET /api/social-proof` mengembalikan 10 order DELIVERED terakhir yang disamarkan; rotasi 8 detik; hormati `prefers-reduced-motion`).
4. `/pricelist` sederhana.

**Checklist visual:** identik struktur referensi; aksen emerald; light default + dark rapi; responsive 360px; fokus keyboard terlihat.

---

## A3 — Payment & Order Agent

**Scope:** alur order + Tripay + webhook + cron. Bergantung: A1.

1. `src/lib/payment/tripay.ts` (createTransaction, verifyCallbackSignature dengan `timingSafeEqual`).
2. Halaman `/produk/[slug]` + server action `createOrder` (validasi Zod: WA format 62, email; hitung harga dari DB — JANGAN percaya harga dari client) → Tripay → simpan order PENDING → redirect invoice.
3. Webhook `/api/webhook/payment` persis alur implementation.md §4 (signature → idempotent → transaksi DB → pengambilan stok atomik `FOR UPDATE SKIP LOCKED` → deliveries snapshot → fire-and-forget WA).
4. `/api/cron/expire` dengan `CRON_SECRET`.
5. Route `GET /api/orders/[id]/status` untuk polling invoice.

**Tes wajib (tulis sebagai script/route dev):** signature salah → 403; webhook duplikat → stok terpakai tetap 1; dua order bersamaan varian sama → dapat stok berbeda.

---

## A4 — Invoice Agent

**Scope:** `/invoice/[id]`. Bergantung: A3.

Implement 4 state (PENDING dengan QR + countdown + polling 5 detik; PROCESSING; DELIVERED dengan kartu akun + tombol salin per field + garansi + link klaim WA; EXPIRED/FAILED). Data akun hanya dirender bila status DELIVERED. Desain mengikuti design system, status color: emerald/amber/rose.

---

## A5 — Admin Agent

**Scope:** `/admin`. Bergantung: A1, A3.

1. Auth: login page, iron-session cookie httpOnly, middleware proteksi semua route `/admin/*`, bcrypt compare terhadap `ADMIN_PASSWORD_HASH`.
2. Dashboard, CRUD Produk+Varian, Stok (bulk paste `email|password|profil|pin|catatan` dengan preview), Order (filter, detail, proses manual → DELIVERED, refund manual), Pengaturan.
3. UI admin boleh lebih sederhana (tabel + form), tetap konsisten token warna.

---

## A6 — QA & Polish Agent

**Scope:** review akhir. Bergantung: semua.

1. Jalankan alur end-to-end sandbox dan catat hasil di `QA.md`.
2. Audit: tidak ada teks Inggris di UI publik, semua Rupiah `id-ID`, dark mode tiap halaman, tidak ada secret ter-hardcode, tidak ada aset hasil hotlink pihak ketiga, `npm run build` bersih tanpa error/warning penting.
3. Lighthouse cepat: perbaiki masalah kontras & ukuran tap target bila ada.
4. Tulis `README.md`: setup env, migrasi, seed, deploy Vercel, konfigurasi callback URL Tripay, contoh cron VPS (`crontab` curl tiap 5 menit).
