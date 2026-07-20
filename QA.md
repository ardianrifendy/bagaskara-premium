# QA.md — Laporan Quality Assurance (QA)

Laporan hasil pengujian fungsional dan keamanan sistem end-to-end untuk Bagaskara Premium Store (Fase 1 MVP).

## Informasi Lingkungan Pengujian
- **Tanggal Pengujian**: 19 Juli 2026
- **Status Rilis**: Fase 1 (MVP) - **SIAP DEPLOY (LULUS QA)**
- **Versi Node.js**: v22.20.0
- **Database**: Neon Postgres (Serverless Http Client)
- **Payment Gateway**: Tripay Mode Sandbox (`TRIPAY_MODE=sandbox`)
- **App URL**: `http://localhost:3000` (Local) / `https://digital.bagaskaracell.net` (Production)

---

## Daftar Skenario Pengujian & Hasil Verifikasi

### 1. Katalog Produk & Filter Layanan
- **Metode Pengujian**: Memuat halaman utama, mengetik di bilah pencarian produk, dan mengklik tab kategori.
- **Hasil Verifikasi**:
  - Filter kategori berjalan instan di client-side (Semua Produk, Desain & Edit, Streaming & Media, Musik, Apps & Tools).
  - Kolom pencarian memfilter produk berdasarkan nama dan tagline secara real-time.
  - Kartu produk menampilkan badge (HOT/AUTO/SMART), initial-based `ProductIcon` yang konsisten (menghindari hotlink gambar eksternal), dan tagline.
- **Status**: **LULUS**

### 2. Alur Pembuatan Pesanan (`createOrder` Server Action)
- **Metode Pengujian**: Membuka halaman detail produk `/produk/netflix-4k`, memilih varian, mengisi nomor WhatsApp `08123456789`, email `test@buyer.com`, dan menekan tombol bayar.
- **Hasil Verifikasi**:
  - Input WhatsApp divalidasi dengan regex dan dinormalisasi menjadi `628123456789` secara otomatis di server.
  - Alamat email divalidasi dengan format Zod.
  - Harga varian diambil langsung dari database (mengabaikan input harga dari browser demi keamanan).
  - ID Invoice di-generate dengan format non-sequential `BGS-XXXXXXXX` (8 karakter alphanumeric uppercase).
  - Berhasil membuat transaksi di Tripay Sandbox dan menyimpan pesanan dengan status `PENDING`.
  - Berhasil redirect otomatis ke halaman invoice `/invoice/BGS-XXXXXXXX`.
- **Status**: **LULUS**

### 3. Halaman Invoice Publik & Status Polling
- **Metode Pengujian**: Membuka halaman invoice pending, mengamati countdown timer dan QR code, serta memicu polling status.
- **Hasil Verifikasi**:
  - **PENDING**: Menampilkan kode QRIS dinamis (dari Tripay), hitung mundur expired 60 menit, langkah pembayaran, dan tombol batalkan yang berfungsi merubah status ke FAILED.
  - **POLLING**: Halaman invoice melakukan hit HTTP ke `/api/orders/[id]/status` setiap 5 detik. Ketika status di DB berubah, halaman otomatis me-refresh data tanpa hard reload.
  - **PROCESSING**: Banner amber menyala saat order berstatus PAID atau PROCESSING.
  - **DELIVERED**: Banner emerald menyala, detail data akun premium (Email, Password, Profil, PIN, Catatan) tampil rapi dengan tombol salin per field. Tombol "Klaim Garansi" mengarah ke WhatsApp CS dengan prefilled text yang menyertakan ID Invoice.
  - **EXPIRED/FAILED**: Banner rose menyala dan menyajikan tombol "Buat Pesanan Baru" kembali ke `/`.
- **Status**: **LULUS**

### 4. Integrasi Webhook Gateway & Pengiriman Stok Atomik
- **Metode Pengujian**: Simulasi webhook Tripay Sandbox dengan post request ke `/api/webhook/payment`.
- **Hasil Verifikasi**:
  - Webhook menolak request jika signature HMAC-SHA256 salah (Mengembalikan HTTP 403 - Forbidden).
  - **Idempotensi**: Webhook dengan payload ganda (transaksi sama dikirim dua kali) hanya diproses satu kali (panggilan kedua mengembalikan `Order already processed`).
  - **Pengambilan Stok Atomik**: Query tunggal database PostgreSQL `UPDATE stock_items SET status = 'SOLD', sold_order_id = $orderId WHERE id = (SELECT id FROM stock_items WHERE variant_id = $variantId AND status = 'AVAILABLE' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING id` berhasil mengunci dan mengekstrak stok secara aman tanpa resiko double allocation (dibuktikan lewat unit pengujian `/api/dev-test`).
  - **Deliveries Snapshot**: Data akun pembeli disimpan sebagai salinan JSONB statis di tabel `deliveries`, melindunginya dari perubahan stok di masa depan.
  - Notifikasi WA dipicu secara asinkron tanpa menahan response webhook.
- **Status**: **LULUS**

### 5. Autentikasi Admin & Proteksi Rute
- **Metode Pengujian**: Mengakses `/admin` tanpa login, menguji form login di `/admin/login`, dan mengklik tombol logout.
- **Hasil Verifikasi**:
  - Akses langsung ke `/admin` atau rute di dalamnya diblokir oleh Next.js `middleware.ts` jika cookie sesi `bagaskara_admin_session` tidak ada (otomatis redirect ke `/admin/login`).
  - Kredensial divalidasi secara aman terhadap password hash `bcrypt` (salt rounds: 12). Sesi terenkripsi HttpOnly disimpan via `iron-session`.
  - Tombol logout menghancurkan sesi dan mengalihkan kembali ke `/admin/login`.
- **Status**: **LULUS**

### 6. Konsol Pengelolaan Admin
- **Metode Pengujian**: Menguji menu Dashboard, CRUD Produk, Impor Stok, Manajemen Order, dan Pengaturan.
- **Hasil Verifikasi**:
  - **Dashboard**: Menampilkan metrik omzet hari ini dan mingguan, antrean order, serta modul peringatan stok menipis (&lt;3) untuk varian otomatis.
  - **Produk**: CRUD kategori, produk, dan varian berjalan lancar. Perubahan data langsung me-revalidate path terkait.
  - **Stok**: Bulk importer mem-parsing input paste berformat `email|password|profil|pin|catatan` secara real-time ke tabel preview. Stok dapat ditandai `PROBLEM`.
  - **Order**: Menampilkan semua order dengan pencarian & filter status. Untuk order `PROCESSING`, admin dapat memasukkan kredensial akun secara manual untuk menyelesaikannya (mengubah status ke DELIVERED dan mengirim notif WA). Tombol "Refund Manual" berfungsi merubah status ke REFUNDED dan mencatat log pelaku perubahan (Rule 9).
  - **Pengaturan**: Berhasil menyimpan nomor WhatsApp CS, teks kebijakan garansi, dan status toggle social proof ke basis data.
- **Status**: **LULUS**

### 7. Keamanan & Kepatuhan Desain (Mobile-First)
- **Metode Pengujian**: Menjalankan build Next.js dan merender halaman pada viewport HP 360px.
- **Hasil Verifikasi**:
  - **Zero Secret Committed**: Berkas `.env` aman dalam `.gitignore` dan contoh dikonfigurasi lengkap di `.env.example`.
  - **Zero Emojis**: Kode sumber dan teks UI bebas dari emoji demi profesionalitas sapaan "Anda".
  - **360px Viewport**: Tidak ada horizontal overflow. Elemen pencarian dan tabel harga dibungkus rapi.
  - **Tap Target**: Seluruh tombol interaktif (cek invoice, order, copy, filter) memiliki tinggi tap target minimal 44px.
  - **Warna Aksen**: Konsisten emerald (hijau) dan zinc. Warna ungu/violet dihindari sepenuhnya sesuai Design System.
- **Status**: **LULUS**

### 8. Transisi QRIS Statis-ke-Dinamis & Verifikasi Manual Admin
- **Metode Pengujian**: Menguji pembuatan pesanan dengan dynamic QRIS (dihasilkan dari static QRIS di database settings), memverifikasi alur manual payment confirmation dari sisi admin panel, serta menjalankan unit/integration test local di `/api/dev-test`.
- **Hasil Verifikasi**:
  - **Dynamic QRIS Generator**: Konverter parse string static QRIS EMVCo, mengganti initiation method ke dynamic, menginjeksi tag 54 (amount), menghapus tag 63 lama, menyusun kembali tag-tag, menghitung ulang CRC16 CCITT, dan menyematkannya di akhir string secara akurat.
  - **Tripay Bypass**: Fungsi order creation mem-bypass request API Tripay dan memproduksi QR Code dinamis berbasis payload hasil konversi QRIS statis lokal.
  - **Manual Payment Confirmation**: Dashboard order admin dilengkapi tombol "Konfirmasi Bayar" untuk pesanan pending. Mengklik tombol ini memicu server action yang memverifikasi pembayaran secara manual dengan logic atomik database (`FOR UPDATE SKIP LOCKED`) untuk auto-stock delivery atau memindahkan status ke `PROCESSING` jika manual/stok kosong, dan memicu notifikasi WA.
  - **Integration Test**: Endpoint `/api/dev-test` diperbarui untuk memverifikasi logic verifikasi manual admin & proteksi keamanan. Pengujian berhasil dengan status: **ALL TESTS PASSED**.
- **Status**: **LULUS**
