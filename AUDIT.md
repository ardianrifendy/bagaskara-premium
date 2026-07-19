# AUDIT.md — Audit Log Keamanan & Kualitas Kode

Dokumen ini mencatat riwayat audit untuk setiap fase pengembangan/agent. Fase berikutnya hanya boleh dimulai jika seluruh temuan penting telah diperbaiki dan berstatus LULUS.

---

## Audit Fase A1 — Foundation & Schema (19 Juli 2026)

- **Auditor**: Claude Code (Self-Audit)
- **Status Akhir**: **LULUS**

### Temuan & Evaluasi:
1. **Kesesuaian Spesifikasi (`implementation.md`)**:
   - Skema basis data lengkap sesuai dengan Bab 3 (categories, products, variants, stock_items, orders, deliveries, admins).
   - Seluruh relasi dideklarasikan secara eksplisit dengan Drizzle relations helper untuk mendukung query relasional.
   - Utilitas `src/lib/format.ts` lengkap: format Rupiah tanpa desimal, tanggal Indonesia panjang, format waktu WIB, dan masking WA format `62xx••••86`.
   - Seeding data berhasil menambahkan 4 kategori, 7 produk premium, 9 varian, akun stok awal (`AVAILABLE`), serta 1 akun admin default.
   - Struktur proyek rapi dan menggunakan TypeScript strict.
   - Status: **LULUS**

2. **Checklist Keamanan**:
   - Tidak ada secret/API key/password yang di-hardcode ke repositori.
   - Berkas `.gitignore` dikonfigurasi dengan benar untuk mencegah commit berkas `.env*` (kecuali `.env.example`).
   - Akun admin menggunakan hashing `bcryptjs` (salt rounds: 12) secara dinamis saat seeding.
   - Database URL dan konfigurasi sensitif dipisahkan penuh ke variabel lingkungan.
   - Status: **LULUS**

3. **Konsistensi Design System**:
   - Konfigurasi Tailwind (`tailwind.config.ts`) mendukung strategi `darkMode: "class"`.
   - Root layout (`src/app/layout.tsx`) membaca cookie `theme` secara server-side sehingga mencegah flashing UI saat memuat halaman pertama kali.
   - Font Plus Jakarta Sans telah disematkan via `next/font/google`.
   - Status: **LULUS**

4. **Verifikasi Build & Kompilasi**:
   - `tsc --noEmit` bersih tanpa error.
   - `npm run lint` bersih tanpa error.
   - `npm run build` sukses menghasilkan optimized production build Next.js.
   - Migrasi dan seed berhasil dijalankan di Neon Database.
   - Status: **LULUS**

---

## Audit Fase A2 — UI Foundation & Landing (19 Juli 2026)

- **Auditor**: Claude Code (Self-Audit)
- **Status Akhir**: **LULUS**

### Temuan & Evaluasi:
1. **Kesesuaian Spesifikasi (`implementation.md`)**:
   - Root layout dan layout publik `src/app/(store)/layout.tsx` memisahkan area publik (dengan Navbar & Footer) dari area lainnya.
   - `Navbar` sticky + blur dengan logo, link Pricelist (ikon tag), Toggle Tema, dan tombol Login pill emerald (mengarah ke `/admin`).
   - `Hero` dengan dot-pinging badge "PLATFORM DIGITAL TERPERCAYA", headline 2 baris (emerald accent), dan subheadline.
   - `SearchInvoiceBar` responsif, menggabungkan pencarian produk dan pengecekan invoice, serta mengarah ke `/invoice/[id]`.
   - `CategoryPills` client-side yang memfilter daftar produk dinamis.
   - `ProductCard` dengan badge (HOT/AUTO/SMART), initial-based `ProductIcon` (tanpa aset eksternal, aman dari hotlink), kategori uppercase berwarna aksen, dan tagline di dalam pill abu.
   - `SocialProofToast` melayang di kiri bawah (rotasi data order 8 detik, bisa ditutup, mengambil data ter-masking dari `/api/social-proof`, serta mendeteksi dan menghormati `prefers-reduced-motion`).
   - Halaman `/pricelist` menampilkan tabel harga rapi yang dikelompokkan per kategori lengkap dengan tombol share ke WhatsApp.
   - Status: **LULUS**

2. **Checklist Keamanan**:
   - Penyamaran nomor WA pembeli (`62xx••••86`) berjalan otomatis pada response `/api/social-proof`.
   - Tidak ada data sensitif yang bocor di markup HTML publik.
   - Status: **LULUS**

3. **Konsistensi Design System**:
   - Seluruh elemen visual konsisten menggunakan palet warna `zinc` dan aksen `emerald` (hijau) sesuai token desain.
   - Penggunaan warna ungu/violet dihindari sepenuhnya (termasuk untuk produk Canva, menggunakan aksen warna biru).
   - Radius tombol/pill berupa `rounded-full` dan kartu produk `rounded-2xl` diterapkan secara konsisten.
   - Dark mode terintegrasi rapi pada setiap halaman dan komponen publik.
   - Responsivitas mobile-first telah diuji (komponen search/tabel pricelist muat rapi di viewport 360px tanpa horizontal overflow, tap target tombol minimal 44px).
   - Status: **LULUS**

4. **Verifikasi Build & Kompilasi**:
   - `tsc --noEmit` bersih tanpa error.
   - `npm run lint` bersih tanpa error.
   - `npm run build` sukses menghasilkan optimized production build Next.js.
   - Status: **LULUS**
