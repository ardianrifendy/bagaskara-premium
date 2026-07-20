import Link from "next/link";
import { ArrowLeft, Search, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-955 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-16">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Visual Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
              <ShieldAlert className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
              404
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Maaf, produk atau halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan oleh admin.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:text-zinc-955 dark:hover:bg-emerald-400 text-xs sm:text-sm font-bold transition-all shadow-md min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Link>
            <Link
              href="/pricelist"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors min-h-[44px]"
            >
              <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Lihat Daftar Harga</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
