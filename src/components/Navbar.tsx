import Link from "next/link";
import { Store } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl p-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 shadow-md shadow-emerald-500/25 transition-transform group-hover:scale-105">
            <Store className="h-6 w-6 stroke-[2.25]" />
          </div>
          <span className="font-sans text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Bagaskara <span className="text-emerald-600 dark:text-emerald-500">Premium</span>
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Link
            href="/admin"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
          >
            Login Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
