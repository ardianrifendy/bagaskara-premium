import Link from "next/link";
import { Tag, Store } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1">
          <Store className="h-6 w-6 text-emerald-600 dark:text-emerald-500 transition-transform group-hover:scale-110" />
          <span className="font-sans text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Bagaskara <span className="text-emerald-600 dark:text-emerald-500">Premium</span>
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/pricelist"
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
          >
            <Tag className="h-4 w-4" />
            <span>Pricelist</span>
          </Link>

          <ThemeToggle />

          <Link
            href="/admin"
            className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
