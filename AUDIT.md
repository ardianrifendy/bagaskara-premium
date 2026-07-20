# AUDIT REPORT — Fitur Search Bar Admin, Filter Status & Sorting, Indikator Stok Habis di Beranda, Kode Promo, Auto-Timeout & Admin Cancel Order

**Tanggal:** 20 Juli 2026  
**Status Audit:** LULUS (ZERO-ERROR)

---

## 1. Scope Implementasi
*   **Search Bar, Filter Status & Sort Admin (`src/components/AdminProductManager.tsx`)**:
    *   **Pencarian Real-Time**: Input pencarian instant untuk memfilter produk berdasarkan **Nama Produk**, **Slug**, **Tagline**, maupun **Nama Kategori**.
    *   **Filter Dropdown Status & Kategori**: Pilihan filter kategori dan status (`Semua Status`, `Hanya Aktif`, `Hanya Non-Aktif`).
    *   **Sorting Multimode & Header Clickable**: Pilihan sorting via dropdown (`Urutan Default`, `Status: Aktif Pertama`, `Status: Non-Aktif Pertama`, `Nama A-Z`, `Nama Z-A`) serta klik langsung pada header kolom tabel (`PRODUK`, `STATUS`, `URUTAN`).
*   **Indikator Stok Habis di Beranda (`src/app/(store)/page.tsx` & `ProductCard.tsx`)**:
    *   **Kalkulasi Stok Real-time**: Server mengecek persediaan varian (`AUTO_STOCK` & `AVAILABLE`) pada tiap produk secara otomatis.
    *   **Badge & Pill "Stok Habis"**: Jika produk tidak memiliki varian aktif / stok habis, kartu produk di beranda menampilkan badge merah **"Stok Habis"** di pojok kanan atas serta label *"Stok Sedang Kosong"* pada pill tagline.
*   **Penanganan Stok Habis & Varian Kosong (Perbaikan Bug 404)**:
    *   **Perbaikan Route `/produk/[slug]`**: Jika varian produk habis (`activeVariants.length === 0`), halaman tetap dapat diakses dengan menyajikan kartu informasi khusus *"Stok / Varian Belum Tersedia"*.
    *   **Custom 404 Page (`src/app/not-found.tsx`)**: Dibuat halaman 404 elegan berstandar Bagaskara Premium.
*   **Auto-Timeout & Expiration Handler**:
    *   **Auto-Expire di Halaman Admin (`/admin/order`)**: Setiap kali admin memuat halaman kelola transaksi, query otomatis mengecek pesanan `PENDING` yang telah melewati `expiredAt` dan langsung mengubah statusnya di DB menjadi `EXPIRED`.
    *   **Auto-Expire di Polling API (`/api/orders/[id]/status`)**: Saat client/invoice melakukan polling status, jika batas waktu habis, status otomatis diubah ke `EXPIRED` di DB.
    *   **Auto-Expire di Halaman Invoice (`/invoice/[id]`)**: Halaman invoice publik otomatis mendeteksi batas waktu yang terlewat dan menampilkan status `EXPIRED`.
*   **Opsi Pembatalan Pesanan oleh Admin (`AdminOrderManager.tsx` & `admin-order.ts`)**:
    *   Server Action `cancelOrderAdmin(orderId)`: Admin dapat membatalkan pesanan status `PENDING` kapan saja secara manual.
    *   Tombol **"Batalkan"** (Rose button) ditambahkan di tabel transaksi pada setiap pesanan `PENDING`.
    *   Tombol **"Batalkan Pesanan"** juga ditambahkan dalam Modal Detail Transaksi lengkap dengan modal konfirmasi keamanan.
*   **Kode Promo & Diskon (`src/db/schema.ts`, `promo.ts`, `ProductOrderClient.tsx`, `InvoiceClient.tsx`)**:
    *   Tabel `promo_codes` & enum `promoTypeEnum`.
    *   Validasi server-side, hitung diskon real-time di checkout, serta kelola CRUD promo di `/admin/promo`.

---

## 2. Gate Verification Output
1.  **Type Check (`npx tsc --noEmit`)**: `0 errors found` (Clean).
2.  **Linter (`npm run lint`)**: `0 errors` (Clean).
3.  **Production Build (`npm run build`)**: `Exit code: 0` (Clean).
4.  **Git Synchronization**: Commit `fbc181d` berhasil di-push ke branch `main`.

---

## 3. Perintah Deployment Server VPS (Prompt untuk User)

```bash
git pull origin main
npm run build
pm2 restart bagaskara-store
```
