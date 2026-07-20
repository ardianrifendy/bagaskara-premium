import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Database,
  Receipt,
  Settings,
  Store,
  User,
  Ticket,
} from "lucide-react";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // 1. Double-check Server Session Protection
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect("/admin/login");
  }

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/produk", label: "Produk & Varian", icon: Package },
    { href: "/admin/stok", label: "Kelola Stok", icon: Database },
    { href: "/admin/order", label: "Kelola Order", icon: Receipt },
    { href: "/admin/promo", label: "Kode Promo", icon: Ticket },
    { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden md:flex flex-col flex-shrink-0">
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="flex items-center gap-2.5 font-sans font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 shadow-sm">
              <Store className="h-4.5 w-4.5 stroke-[2.25]" />
            </div>
            <span>Bagaskara Admin</span>
          </Link>
        </div>

        {/* Menu links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold text-zinc-600 hover:text-emerald-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-emerald-500 dark:hover:bg-zinc-850 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <item.icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 text-center">
          &copy; Bagaskara Cell Admin Panel
        </div>
      </aside>

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 flex-shrink-0">
          {/* Left: Section name / Brand logo on mobile */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 shadow-sm md:hidden">
              <Store className="h-4.5 w-4.5 stroke-[2.25]" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 md:hidden">
              Bagaskara Admin
            </span>
            <span className="hidden md:inline text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Sistem Otomatis 24 Jam
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Profile chip */}
            <div className="inline-flex h-10 items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-full px-5 bg-zinc-50 dark:bg-zinc-900/80 text-xs font-extrabold text-zinc-800 dark:text-zinc-100 shadow-sm">
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="capitalize tracking-wide">{session.username}</span>
            </div>

            <AdminLogoutButton />
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Mobile quick navigation (just a row of icons on very small screens if sidebar is hidden) */}
          <div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 mb-6 shadow-sm overflow-x-auto gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center p-2 rounded-xl text-zinc-500 hover:text-emerald-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex-shrink-0"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold mt-1">{item.label}</span>
              </Link>
            ))}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
