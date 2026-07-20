import Link from "next/link";
import { Store, MessageCircle, Clock } from "lucide-react";

interface FooterProps {
  csWhatsapp?: string;
}

export default function Footer({ csWhatsapp = "6289513679939" }: FooterProps) {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 shadow-md shadow-emerald-500/25">
                <Store className="h-6 w-6 stroke-[2.25]" />
              </div>
              <span className="font-sans text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Bagaskara Premium
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
              Toko akun premium otomatis 24 jam dengan proses cepat, aman, dan bergaransi penuh.
              Dapatkan akses aplikasi streaming, musik, desain, dan tools produktivitas dengan harga paling hemat.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
              Tautan Cepat
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/pricelist" className="text-sm text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-500 transition-colors">
                  Pricelist Layanan
                </Link>
              </li>
              <li>
                <Link href="/#cek-invoice" className="text-sm text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-500 transition-colors">
                  Cek Invoice
                </Link>
              </li>
              <li>
                <span className="text-sm text-zinc-400 dark:text-zinc-500 cursor-not-allowed">
                  Syarat & Ketentuan (Segera Hadir)
                </span>
              </li>
              <li>
                <span className="text-sm text-zinc-400 dark:text-zinc-500 cursor-not-allowed">
                  Kebijakan Garansi (Segera Hadir)
                </span>
              </li>
              {/* Discreet login admin link for mobile administrators */}
              <li className="pt-2">
                <Link href="/admin" className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
                  Login Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & CS Hours */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Layanan Pelanggan
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                <span>Jam Operasional: 08:00 - 22:00 WIB</span>
              </div>
              <a
                href={`https://wa.me/${csWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                <span>Hubungi CS WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Bagaskara Cell. Hak Cipta Dilindungi.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Powered by Next.js & Neon
          </p>
        </div>
      </div>
    </footer>
  );
}
