# CLAUDE.md — Bagaskara Premium Store

Konteks proyek untuk Claude Code. Baca file ini sebelum mengerjakan task apa pun.

## RULES EKSEKUSI (PRIORITAS TERTINGGI)

1. **Wajib jalan dengan agent & sub-agent.** Setiap fase dikerjakan sesuai pembagian `agents.md` (A1–A6). Setiap agent WAJIB memecah tugasnya ke sub-agent (Task tool) untuk pekerjaan independen yang bisa paralel — misal: sub-agent per halaman, per komponen, per endpoint. Dilarang mengerjakan semua dalam satu alur monolitik.
2. **Mode bypass permission.** Proyek dijalankan dengan `claude --dangerously-skip-permissions` di folder proyek. Jangan berhenti untuk minta konfirmasi operasi file/perintah rutin; langsung eksekusi. (Catatan operator: jalankan hanya di dalam folder proyek ini, jangan di home directory.)
3. **Zero-error.** Tidak boleh menandai task/agent selesai jika masih ada error. Wajib lolos berurutan: `tsc --noEmit` → `npm run lint` → `npm run build` tanpa error. Ada error → perbaiki sampai bersih dulu, baru lanjut.
4. **Selalu audit.** Setiap agent WAJIB mengakhiri pekerjaannya dengan sub-agent AUDITOR yang memeriksa: kesesuaian dengan `implementation.md`, checklist keamanan (signature webhook, idempotency, stok atomik, tidak ada secret hardcode), konsistensi design system, dan hasil build. Temuan dicatat append di `AUDIT.md` (format: tanggal, agent, temuan, status perbaikan). Agent berikutnya TIDAK BOLEH mulai sebelum audit agent sebelumnya berstatus LULUS.
5. **Efisiensi token sub-agent.** Sub-agent hanya diberi konteks file yang relevan dengan tugasnya, bukan seluruh repo. Instruksi sub-agent ditulis spesifik dan ringkas.
6. **Checkpoint commit per agent.** Setelah audit agent berstatus LULUS, WAJIB `git add -A && git commit` dengan format `feat(A2): landing + design system` sebelum agent berikutnya mulai. Repo di-init di A1 (`git init` + commit awal). Jika terjadi kerusakan, rollback ke commit agent terakhir yang LULUS.
7. **Batas wilayah kerja.** Dilarang membaca/menulis/menghapus file di luar folder proyek. Dilarang `rm -rf` tanpa path eksplisit relatif terhadap proyek. Dilarang mengubah konfigurasi global sistem/git global.
8. **Dilarang commit secret.** `.gitignore` berisi `.env*` (kecuali `.env.example`) sejak A1. AUDITOR wajib scan hasil commit: tidak ada API key, password, connection string, atau hash kredensial di file yang ter-commit.
9. **Semua transaksi uang tercatat.** Perubahan status order HANYA boleh terjadi lewat: webhook payment, cron expire, atau admin action. Tambahkan kolom `statusChangedBy` + `statusChangedAt` di orders untuk setiap perubahan manual. Tidak ada endpoint lain yang bisa mengubah status.
10. **Dilarang log data sensitif.** Password akun stok, payload deliveries, dan private key TIDAK BOLEH muncul di `console.log`, log error, atau response error. Log cukup ID order + status.
11. **Sandbox-first.** Seluruh pengembangan dan tes memakai `TRIPAY_MODE=sandbox`. DILARANG mengubah ke `production` sebelum QA fase 1 selesai dan tercatat LULUS di `QA.md`. AUDITOR A6 memverifikasi ini.
12. **Mobile-first.** Mayoritas pembeli mengakses dari HP. AUDITOR wajib memverifikasi setiap halaman publik pada viewport 360px: tidak ada overflow horizontal, tap target minimal 44px, teks terbaca. Desktop menyusul, bukan sebaliknya.
13. **Auto Push ke GitHub.** Setiap kali selesai mengerjakan perbaikan, fitur baru, atau task apa pun, WAJIB langsung jalankan `git add -A && git commit -m "..." && git push origin main` secara otomatis tanpa menunggu instruksi push manual dari pengguna.

## Tentang Proyek

Toko akun premium otomatis (Netflix, Disney+, Spotify, YouTube, Canva, CapCut, dll) milik Bagaskara Cell. Referensi layout: premku.com (struktur halaman sama, tetapi seluruh kode, copywriting, dan aset dibuat sendiri dari nol — DILARANG menyalin HTML/CSS/JS/gambar dari situs referensi).

Alur inti: user pilih produk → order → bayar QRIS dinamis via payment gateway → webhook → sistem kirim akun otomatis dari stok → halaman invoice menampilkan data akun.

## Tech Stack (WAJIB, jangan diganti)

- Next.js 14+ App Router, TypeScript strict
- Tailwind CSS (dark mode: `class` strategy)
- Neon Postgres + Drizzle ORM (`drizzle-kit` untuk migrasi)
- Payment gateway: Tripay (QRIS dinamis + callback). Struktur kode payment dibuat sebagai adapter agar mudah ganti ke Duitku/Midtrans.
- Deploy: Vercel. Bot WA & cron berjalan terpisah di VPS (di luar scope repo ini, hanya sediakan endpoint API-nya).

## Konvensi Kode

- SELALU tampilkan kode lengkap satu file penuh, bukan potongan/diff.
- Semua UI copy dalam Bahasa Indonesia, sapaan "Anda", format angka/tanggal `id-ID`, Rupiah tanpa desimal (`Rp150.000`).
- Komponen server-first; `"use client"` hanya bila perlu interaktivitas.
- Semua akses DB lewat Drizzle di `src/db/`, tidak ada raw SQL di komponen.
- Validasi input dengan Zod di setiap route handler / server action.
- Secrets hanya lewat env var, tidak pernah hard-code.
- Jangan pakai localStorage untuk state penting; theme toggle boleh pakai cookie.

## Design System (kunci, jangan improvisasi)

- Tema default: LIGHT. Toggle dark mode di navbar (ikon bulan/matahari), preferensi disimpan di cookie `theme`.
- Palet light: background `zinc-50` dengan tint gradasi `emerald-50` di hero, card `white`, border `zinc-200`, teks `zinc-900`/`zinc-500`.
- Palet dark: background `zinc-950`, card `zinc-900`, border `zinc-800`, teks `zinc-100`/`zinc-400`.
- Aksen utama: `emerald-600` (light) / `emerald-500` (dark). Hindari ungu/violet sama sekali.
- Badge produk: HOT = `rose-500`, AUTO = `emerald-500`, SMART = `amber-500`.
- Radius: card `rounded-2xl`, tombol & pill `rounded-full`.
- Font: Plus Jakarta Sans (display + body) via `next/font`, fallback system-ui.
- Status warna: sukses `emerald`, pending `amber`, gagal/expired `rose`.

## Struktur Direktori

```
src/
  app/
    (store)/            # layout publik: navbar + footer
      page.tsx          # landing + katalog
      produk/[slug]/
      invoice/[id]/
      pricelist/
    admin/              # layout admin, proteksi session
    api/
      webhook/payment/route.ts
      cron/expire/route.ts
  components/
  db/
    schema.ts
    index.ts
  lib/
    payment/tripay.ts
    wa.ts               # HTTP call ke bot WA di VPS
    format.ts           # rupiah, tanggal id-ID
```

## Aturan Keamanan (tidak bisa ditawar)

- Webhook WAJIB verifikasi signature HMAC dari gateway sebelum memproses; tolak dengan 403 jika tidak valid.
- Idempotent: webhook yang sama diterima dua kali tidak boleh mengirim stok dua kali (cek status order sebelum update).
- Pengambilan stok memakai transaksi DB + `FOR UPDATE SKIP LOCKED` (atau `UPDATE ... RETURNING` atomik) agar dua order tidak mendapat akun yang sama.
- Data akun di halaman invoice hanya tampil jika status `DELIVERED`; halaman invoice tidak butuh login tetapi ID invoice harus non-sequential (nanoid).
- Admin panel dilindungi session (iron-session / cookie httpOnly), kredensial dari env.

## Perintah

- `npm run dev` — dev server
- `npm run db:generate && npm run db:migrate` — migrasi Drizzle
- `npm run build` — pastikan selalu lolos sebelum menandai task selesai
