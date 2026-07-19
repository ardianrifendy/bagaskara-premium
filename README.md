# Bagaskara Premium Store

Toko akun premium otomatis 24 jam milik Bagaskara Cell. Memungkinkan pembeli memesan akun premium (Netflix, Spotify, Disney+, YouTube, Canva, CapCut, ChatGPT Plus), melakukan pembayaran via QRIS dinamis, dan mendapatkan data akun secara instan langsung di halaman invoice dan WhatsApp.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Bahasa:** TypeScript Strict
- **Styling:** Tailwind CSS (Dark Mode: Class Strategy)
- **Basis Data:** Neon Postgres (Serverless Http Connection)
- **ORM:** Drizzle ORM
- **Payment Gateway:** Tripay
- **Autentikasi Admin:** Iron Session (Cookie HttpOnly)

---

## Konfigurasi Environment (.env)

Buat berkas `.env` di root direktori proyek Anda dan lengkapi variabel berikut (lihat `.env.example`):

```env
# Koneksi Database Neon Postgres
DATABASE_URL="postgresql://username:password@hostname/databasename?sslmode=require"

# Integrasi Tripay (QRIS Dinamis)
TRIPAY_API_KEY="your_tripay_api_key"
TRIPAY_PRIVATE_KEY="your_tripay_private_key"
TRIPAY_MERCHANT_CODE="your_tripay_merchant_code"
TRIPAY_MODE="sandbox" # Gunakan 'sandbox' untuk pengembangan, 'production' untuk live

# URL Aplikasi
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Kredensial Admin & Enkripsi Sesi
SESSION_SECRET="session_secret_minimal_32_karakter_acak"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="" # Isi dengan hash bcrypt (lihat instruksi di bawah)

# Keamanan Endpoint Cron Expire
CRON_SECRET="cron_secret_untuk_verifikasi"

# VPS WhatsApp Bot Hook
WA_BOT_URL="http://ip-wa-bot-vps:port"
WA_BOT_KEY="wa_bot_api_key"
```

---

## Langkah Instalasi & Menjalankan Proyek

Jalankan perintah berikut secara berurutan:

### 1. Instal Dependensi
```bash
npm install
```

### 2. Buat Hash Password Admin
Generate hash bcrypt untuk password admin Anda. Hash ini akan digunakan sebagai nilai `ADMIN_PASSWORD_HASH` di berkas `.env`:

```bash
npm run hash-password
```

Script akan meminta Anda memasukkan password, lalu menampilkan hash bcrypt yang siap disalin. Anda juga bisa langsung memberikan password sebagai argumen:

```bash
npm run hash-password -- "PasswordKuatAnda123!"
```

Salin hash yang dihasilkan ke variabel `ADMIN_PASSWORD_HASH` di berkas `.env` Anda:
```env
ADMIN_PASSWORD_HASH="$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

> **⚠️ Penting:** Tidak ada kredensial admin default. Anda WAJIB membuat hash password sendiri sebelum bisa login ke admin panel.

### 3. Generate Berkas Migrasi Database (Drizzle ORM)
Perintah ini akan membaca skema di `src/db/schema.ts` dan men-generate SQL migrasi di folder `./drizzle`:
```bash
npm run db:generate
```

### 4. Jalankan Migrasi Database
Perintah ini akan mengeksekusi script migrasi dan membuat tabel-tabel di Neon Database secara otomatis:
```bash
npm run db:migrate
```

### 5. Isi Seed Data Awal (Katalog Produk)
Perintah ini akan mengisi kategori, katalog produk, dan varian harga. **Tidak ada stok akun seed dan tidak ada akun admin default** — stok diisi manual via Admin Panel, dan login admin menggunakan environment variable.
```bash
npm run db:seed
```

### 6. Jalankan Server Pengembangan (Dev Mode)
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 7. Uji Build Produksi (Build Test)
Pastikan seluruh tipe TypeScript dan ESLint bersih:
```bash
npm run build
```

---

## Integrasi & Konfigurasi Eksternal

### 1. Webhook Payment Callback (Tripay Dashboard)
Daftarkan Callback URL di Merchant Settings dashboard Tripay Anda:
- **Webhook URL:** `https://domain-anda.com/api/webhook/payment`
Sistem akan memverifikasi signature HMAC-SHA256 dari Tripay secara otomatis. Salah signature akan ditolak 403. Webhook diproteksi dengan sistem **idempotent** dan alokasi stok **atomik** (`UPDATE ... RETURNING` & `FOR UPDATE SKIP LOCKED`).

### 2. Pengujian Suite Pengembang (Dev-Test)
Route `/api/dev-test` **hanya tersedia di mode development** (`NODE_ENV !== "production"`). Di production, route ini mengembalikan 404. Saat berjalan pada mode sandbox/development, Anda dapat menguji kehandalan sistem webhook signature, proteksi idempotensi, dan perlindungan race condition alokasi stok secara otomatis dengan mengakses:
`http://localhost:3000/api/dev-test`

### 3. Konfigurasi Cron Task VPS (Auto-Expired)
Untuk membatalkan otomatis pesanan `PENDING` yang melewati waktu bayar 60 menit, buat cron job di VPS Anda yang berjalan setiap 5 menit:
```bash
*/5 * * * * curl -s -H "Authorization: Bearer <CRON_SECRET_ANDA>" https://domain-anda.com/api/cron/expire >/dev/null 2>&1
```

---

## Akses Admin Panel
- **URL Dashboard:** `https://domain-anda.com/admin`
- **Username:** Sesuai env `ADMIN_USERNAME`
- **Password:** Sesuai hash bcrypt di env `ADMIN_PASSWORD_HASH` (buat dengan `npm run hash-password`)

---

## Checklist Go-Live

Sebelum mengubah aplikasi dari mode sandbox ke production, pastikan seluruh item berikut telah diselesaikan:

### 1. Kosongkan Stok Seed
- [ ] Hapus seluruh stok akun pengujian/dummy dari database.
- [ ] Isi stok akun asli via Admin Panel (`/admin/stok`) menggunakan fitur impor massal.

### 2. Ganti Mode Tripay ke Production
- [ ] Ubah `TRIPAY_MODE="production"` di berkas `.env`.
- [ ] Ganti `TRIPAY_API_KEY`, `TRIPAY_PRIVATE_KEY`, dan `TRIPAY_MERCHANT_CODE` dengan kredensial production dari dashboard Tripay.

### 3. Set Callback URL Production
- [ ] Daftarkan Callback URL production di Merchant Settings dashboard Tripay: `https://domain-anda.com/api/webhook/payment`
- [ ] Pastikan domain sudah ter-deploy dan bisa diakses publik (HTTPS).

### 4. Verifikasi Environment Variables
- [ ] Pastikan `SESSION_SECRET` menggunakan string acak minimal 32 karakter (bukan nilai default).
- [ ] Pastikan `ADMIN_PASSWORD_HASH` sudah diisi dengan hash bcrypt dari password yang kuat (buat dengan `npm run hash-password`).
- [ ] Pastikan `CRON_SECRET` menggunakan string acak yang kuat.
- [ ] Pastikan `NEXT_PUBLIC_APP_URL` mengarah ke domain production.

### 5. Verifikasi Keamanan File
- [ ] Pastikan berkas `.env` **tidak ter-commit** ke repository Git (cek dengan `git status` dan verifikasi `.gitignore`).
- [ ] Pastikan tidak ada secret/API key/password yang ter-hardcode di source code.

### 6. Verifikasi Fungsionalitas
- [ ] Tes pembuatan order dan pembayaran QRIS di environment production.
- [ ] Tes webhook callback Tripay mengirim notifikasi ke URL production.
- [ ] Tes auto-delivery stok akun setelah pembayaran berhasil.
- [ ] Tes cron job `/api/cron/expire` berjalan dengan benar di VPS.
- [ ] Tes login admin panel dan fitur CRUD di production.

### 7. Verifikasi Route Dev-Test
- [ ] Pastikan `/api/dev-test` mengembalikan 404 di production (`NODE_ENV=production`).
