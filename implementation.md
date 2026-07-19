# implementation.md — Bagaskara Premium Store

Spec implementasi lengkap. Kerjakan berurutan sesuai fase. Referensi visual: screenshot premku.com (layout ditiru strukturnya, warna diganti emerald, seluruh kode & aset dibuat sendiri).

---

## 1. Tujuan & Ruang Lingkup

Website toko akun premium dengan pemrosesan otomatis 24 jam:

1. Katalog produk dengan filter kategori + pencarian.
2. Order tanpa login: nomor WA + email → QRIS dinamis → bayar → akun terkirim otomatis.
3. Halaman invoice publik sebagai pusat status order (QR, countdown, data akun setelah bayar).
4. Admin panel: kelola produk/varian, stok akun, order, dan proses manual untuk produk semi-otomatis.
5. Cek invoice dari homepage.

Di luar scope fase 1: login member, harga reseller, deposit saldo, bot WA (hanya disiapkan hook HTTP-nya).

---

## 2. Design System & Layout

### 2.1 Token

| Token | Light | Dark |
|---|---|---|
| Background halaman | `bg-zinc-50` | `bg-zinc-950` |
| Hero backdrop | gradasi radial `from-emerald-100/60 via-zinc-50 to-zinc-50` | `from-emerald-950/40 via-zinc-950 to-zinc-950` |
| Card | `bg-white border-zinc-200` | `bg-zinc-900 border-zinc-800` |
| Teks utama / sekunder | `text-zinc-900` / `text-zinc-500` | `text-zinc-100` / `text-zinc-400` |
| Aksen / CTA | `bg-emerald-600 hover:bg-emerald-500 text-white` | `bg-emerald-500 hover:bg-emerald-400 text-zinc-950` |
| Highlight headline | `text-emerald-600` | `text-emerald-400` |

Font: Plus Jakarta Sans (weight 400/600/800) via `next/font/google`. Radius: card `rounded-2xl`, tombol/pill/input `rounded-full`. Shadow card: `shadow-sm hover:shadow-md transition`.

Dark mode: Tailwind `darkMode: "class"`, class `dark` di `<html>`, dibaca dari cookie `theme` di root layout (tanpa flash). Toggle di navbar.

### 2.2 Struktur Halaman Landing (urut atas ke bawah, meniru referensi)

1. **Navbar** (sticky, blur): logo + nama "Bagaskara Premium" kiri; kanan: link "Pricelist" dengan ikon tag, toggle dark mode, tombol pill "Login" emerald (fase 3, sementara link ke /admin).
2. **Hero**: badge pill kecil bertitik hijau "PLATFORM DIGITAL TERPERCAYA"; headline 2 baris — baris 1 `text-zinc-900` "Akses Apps Premium,", baris 2 aksen emerald + titik: "Harga Bikin Hemat." (font extrabold, tracking tight); subheadline 2 kalimat singkat tentang otomatis, cepat, bergaransi.
3. **Search bar gabungan** dalam satu container putih rounded-full shadow: input "Cari layanan (cth: Spotify)…" | separator | input "ID Invoice…" + tombol pill emerald "Cek". Submit invoice → redirect `/invoice/[id]`.
4. **Filter kategori** pill horizontal: Semua Produk (aktif = emerald solid), Desain & Edit, Streaming & Media, Musik, Apps & Tools. Filter client-side.
5. **Grid produk**: 2 kolom mobile / 3 tablet / 6 desktop, gap-4. Kartu: badge pojok kiri atas (HOT/AUTO/SMART bila ada), ikon produk 80×80 rounded-2xl di tengah, label kategori kecil uppercase berwarna aksen kategori, nama produk semibold, tagline singkat dalam pill abu (mis. "Stream 4K", "Tanpa Iklan"). Hover: naik sedikit (`-translate-y-1`) + shadow. Klik → `/produk/[slug]`.
6. **Social proof toast** melayang kiri bawah: "62xx••••86 • 12 menit lalu — Membeli Netflix 1 Bulan". Data diambil dari order DELIVERED terakhir (nomor disamarkan), rotasi tiap 8 detik, bisa ditutup, hormati `prefers-reduced-motion`.
7. **Footer**: 3 kolom — brand + deskripsi singkat, link cepat (Pricelist, Cek Invoice, Syarat & Ketentuan, Garansi), kontak WA & jam operasional CS. Copyright Bagaskara Cell.

### 2.3 Halaman Produk `/produk/[slug]`

- Header: ikon besar + nama + kategori + deskripsi.
- Pilihan varian: kartu radio (durasi/tipe, harga coret bila ada `compare_price`, badge "Otomatis"/"Diproses 5–30 mnt" sesuai mode delivery).
- Form order: nomor WA (validasi 62xxx), email, catatan opsional.
- Ringkasan: harga + total → tombol "Bayar dengan QRIS".
- Submit → server action buat order + request transaksi Tripay → redirect `/invoice/[id]`.

### 2.4 Halaman Invoice `/invoice/[id]` (halaman terpenting)

Satu halaman, tampilan berubah sesuai status:

- **PENDING**: nominal besar, QR code QRIS (dari `qr_url` Tripay), countdown expired (60 menit), instruksi bayar 3 langkah, polling status tiap 5 detik (route handler ringan), tombol "Batalkan".
- **PAID/PROCESSING** (produk semi-otomatis): banner amber "Pembayaran diterima, pesanan sedang diproses admin (maks. 30 menit)".
- **DELIVERED**: banner emerald "Pesanan selesai"; kartu data akun (email, password, profil, PIN, catatan) dengan tombol salin per baris; info masa aktif & garansi; tombol "Klaim Garansi" (link WA dengan template pesan berisi ID invoice).
- **EXPIRED/FAILED**: banner rose + tombol "Buat Pesanan Baru".

### 2.5 Pricelist `/pricelist`

Tabel sederhana seluruh produk × varian × harga, dikelompokkan per kategori. Tombol share WA.

---

## 3. Database (Drizzle + Neon)

```ts
// src/db/schema.ts — ringkasan kolom, tulis lengkap dengan tipe Drizzle
categories: id, name, slug, accentColor, sortOrder
products:   id, categoryId FK, name, slug UNIQUE, tagline, description,
            iconUrl, badge ENUM('HOT','AUTO','SMART') NULL,
            isActive BOOL, sortOrder, createdAt
variants:   id, productId FK, name, durationDays INT,
            price INT, comparePrice INT NULL, resellerPrice INT NULL,
            deliveryMode ENUM('AUTO_STOCK','MANUAL_INVITE'),
            warrantyDays INT, isActive BOOL
stock_items:id, variantId FK, payloadJson JSONB  // {email,password,profile,pin,note}
            status ENUM('AVAILABLE','SOLD','PROBLEM'), soldOrderId NULL, createdAt
orders:     id TEXT PK (format 'BGS-' + nanoid(8) uppercase),
            variantId FK, productNameSnap, variantNameSnap, price INT,
            waNumber, email, note NULL,
            status ENUM('PENDING','PAID','PROCESSING','DELIVERED','EXPIRED','FAILED','REFUNDED'),
            statusChangedBy TEXT NULL,  -- 'webhook' | 'cron' | 'admin:<username>'
            statusChangedAt TIMESTAMP NULL,
            paymentRef, paymentQrUrl, expiredAt, paidAt NULL, deliveredAt NULL, createdAt
deliveries: id, orderId FK UNIQUE, payloadJson JSONB (SNAPSHOT, bukan referensi stok),
            warrantyUntil, createdAt
admins:     id, username UNIQUE, passwordHash (bcrypt), createdAt
```

Aturan: `deliveries.payloadJson` adalah salinan — jika admin mengedit stok, data yang sudah terkirim ke pembeli tidak berubah.

---

## 4. Integrasi Pembayaran (Tripay, pola adapter)

`src/lib/payment/tripay.ts` mengekspor:

- `createTransaction({orderId, amount, customerName, email, phone})` → panggil `POST /transaction/create` method `QRIS`, signature HMAC-SHA256(`merchantCode+merchantRef+amount`, privateKey). Return `{reference, qrUrl, expiredAt}`.
- `verifyCallbackSignature(rawBody, headerSignature)` → HMAC-SHA256 rawBody dengan privateKey, bandingkan `timingSafeEqual`.

Env: `TRIPAY_API_KEY`, `TRIPAY_PRIVATE_KEY`, `TRIPAY_MERCHANT_CODE`, `TRIPAY_MODE` (`sandbox`/`production`), `NEXT_PUBLIC_APP_URL`.

### Webhook `POST /api/api/webhook/payment` → gunakan path `/api/webhook/payment`

Alur wajib (idempotent):

1. Baca raw body → verifikasi signature; gagal → 403.
2. Parse; ambil `merchant_ref` (= orderId) dan status.
3. Transaksi DB:
   - Order tidak ada / status bukan `PENDING` → return 200 "ok" (jangan proses ulang).
   - Status gateway `PAID` → update order `PAID`, isi `paidAt`.
   - Jika `deliveryMode = AUTO_STOCK`: ambil 1 stok `AVAILABLE` milik varian secara atomik (`UPDATE stock_items SET status='SOLD', sold_order_id=$order WHERE id = (SELECT id FROM stock_items WHERE variant_id=$v AND status='AVAILABLE' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`). Dapat → insert `deliveries` + order `DELIVERED`. Stok kosong → order `PROCESSING` + tandai butuh perhatian admin.
   - Jika `MANUAL_INVITE` → order `PROCESSING`.
4. Setelah commit: fire-and-forget `notifyWa()` ke bot VPS (jangan blokir response).
5. Return 200.

### Cron `GET /api/cron/expire`

Diproteksi header `Authorization: Bearer CRON_SECRET`. Set semua order `PENDING` dengan `expiredAt < now()` menjadi `EXPIRED`. Dipanggil cron VPS tiap 5 menit.

---

## 5. Admin Panel `/admin`

Login username+password (bcrypt, session cookie httpOnly via iron-session). Halaman:

1. **Dashboard**: omzet hari ini/7 hari, order pending/processing, stok menipis (<3) per varian.
2. **Produk**: CRUD produk + varian (termasuk badge, mode delivery, garansi, aktif/nonaktif).
3. **Stok**: pilih varian → textarea bulk paste `email|password|profil|pin|catatan` per baris → preview → simpan; daftar stok dengan status; tandai `PROBLEM`.
4. **Order**: tabel + filter status + cari ID/WA; detail order; untuk `PROCESSING`: form isi data akun manual → tombol "Tandai Selesai" (insert deliveries + status DELIVERED + notif WA); tombol refund manual (ubah status saja, pencatatan).
5. **Pengaturan**: nomor WA CS, teks garansi, toggle social proof.

---

## 6. Bot WA (hook saja, implementasi di VPS terpisah)

`src/lib/wa.ts` → `POST {WA_BOT_URL}/send` body `{to, message}` header `x-api-key: WA_BOT_KEY`, timeout 5 detik, gagal → log saja (jangan gagalkan order). Template pesan (Bahasa Indonesia, "Anda"): order dibuat, akun terkirim (berisi data akun + garansi), order diproses, notif admin order masuk/stok habis.

---

## 7. Env Vars (.env.example wajib dibuat)

```
DATABASE_URL=
TRIPAY_API_KEY=
TRIPAY_PRIVATE_KEY=
TRIPAY_MERCHANT_CODE=
TRIPAY_MODE=sandbox
NEXT_PUBLIC_APP_URL=https://digital.bagaskaracell.net
SESSION_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
CRON_SECRET=
WA_BOT_URL=
WA_BOT_KEY=
```

---

## 8. Seed Data Awal

Buat `src/db/seed.ts`: kategori (Desain & Edit, Streaming & Media, Musik, Apps & Tools) + produk contoh: Netflix 4K (HOT), Disney+, Spotify (AUTO), YouTube Premium, Canva Pro, CapCut Pro, Prime Video, Viu, Vidio, ChatGPT Plus (SMART) — masing-masing 2–3 varian harga placeholder. Ikon sementara: inisial produk di tile berwarna (komponen `ProductIcon`), JANGAN hotlink logo dari situs lain; slot `iconUrl` disiapkan agar admin bisa upload/isi URL sendiri.

---

## 9. Fase Pengerjaan & Definition of Done

**Fase 1 (MVP):** design system + layout publik + katalog + halaman produk + order + Tripay sandbox + webhook + auto-delivery + invoice + admin (produk/stok/order) + cron expire + seed.
DoD: `npm run build` lolos; alur sandbox end-to-end sukses (order → bayar simulasi → akun tampil di invoice); webhook menolak signature salah; dua webhook duplikat hanya mengirim 1 stok; dark mode konsisten di semua halaman; responsive 360px.

**Fase 2:** notif WA, mode MANUAL_INVITE penuh, klaim garansi, pricelist share, social proof dari data nyata.

**Fase 3:** login member, harga reseller, deposit saldo, mutasi transaksi.

---

## 10. Deployment — Subdomain `digital.bagaskaracell.net`

Proyek ini adalah **repo terpisah** dari bagaskaracell.net (bukan route di dalam situs utama), di-deploy sebagai project Vercel sendiri.

1. **Vercel:** buat project baru → Settings > Domains → tambahkan `digital.bagaskaracell.net`.
2. **DNS (panel Biznet GioCloud, zona bagaskaracell.net):** tambah record `CNAME` — name: `digital`, value: `cname.vercel-dns.com`. Tunggu propagasi, SSL otomatis dari Vercel.
3. **Tripay dashboard:** set Callback URL = `https://digital.bagaskaracell.net/api/webhook/payment` (sandbox dan production di-set terpisah sesuai mode).
4. **Env `NEXT_PUBLIC_APP_URL`** = `https://digital.bagaskaracell.net` — dipakai untuk return URL Tripay, link invoice di pesan WA, dan metadata OG.
5. **Cron VPS:** `*/5 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://digital.bagaskaracell.net/api/cron/expire`
6. **SEO:** metadata title "Bagaskara Premium — Akun Premium Otomatis", `robots.txt` + `sitemap.ts` standar Next.js, halaman `/admin` `noindex`. Setelah live, daftarkan subdomain sebagai property terpisah di Google Search Console.
7. **Cross-link:** tambahkan link menu "Produk Digital" di navbar bagaskaracell.net menuju subdomain ini (dikerjakan di repo situs utama, di luar scope repo ini).

Catatan: cookie session admin dan cookie `theme` cukup scoped ke subdomain ini (default), tidak perlu `.bagaskaracell.net`.
