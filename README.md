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

# Hash Bcrypt password admin (dapat di-generate dinamis lewat seed script)
ADMIN_PASSWORD_HASH="$2a$12$6qO1gZ5Z/s1w6vW0gG2/G.y1eQx1Y1K2Y1T2S2W2T2S2W2T2S2W2S" 

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

### 2. Generate Berkas Migrasi Database (Drizzle ORM)
Perintah ini akan membaca skema di `src/db/schema.ts` dan men-generate SQL migrasi di folder `./drizzle`:
```bash
npm run db:generate
```

### 3. Jalankan Migrasi Database
Perintah ini akan mengeksekusi script migrasi dan membuat tabel-tabel di Neon Database secara otomatis:
```bash
npm run db:migrate
```

### 4. Isi Seed Data Awal
Perintah ini akan mengisi kategori, katalog produk, varian harga placeholder, stok akun pengujian, dan membuat akun admin utama (`admin` | `bagaskara123`):
```bash
npm run db:seed
```

### 5. Jalankan Server Pengembangan (Dev Mode)
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 6. Uji Build Produksi (Build Test)
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
Saat berjalan pada mode `sandbox` atau `development`, Anda dapat menguji kehandalan sistem webhook signature, proteksi idempotensi, dan perlindungan race condition alokasi stok secara otomatis dengan mengakses:
`http://localhost:3000/api/dev-test`

### 3. Konfigurasi Cron Task VPS (Auto-Expired)
Untuk membatalkan otomatis pesanan `PENDING` yang melewati waktu bayar 60 menit, buat cron job di VPS Anda yang berjalan setiap 5 menit:
```bash
*/5 * * * * curl -s -H "Authorization: Bearer <CRON_SECRET_ANDA>" https://domain-anda.com/api/cron/expire >/dev/null 2>&1
```

---

## Informasi Akun Admin Awal
- **URL Dashboard:** `http://localhost:3000/admin`
- **Username:** `admin` (atau sesuaikan env `ADMIN_USERNAME`)
- **Password:** `bagaskara123` (password default hasil `npm run db:seed`)
