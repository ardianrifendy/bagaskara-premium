"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/app/actions/auth";
import { Store, ShieldAlert, Key, User, Lock, Send } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginAdmin({ username, password });
      if (res.success) {
        // Successful login -> go to admin panel
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error || "Gagal masuk ke sistem.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan koneksi.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      <div className="w-full max-w-md space-y-6">
        {/* Branding & Title */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2 group p-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg">
            <Store className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
            <span className="font-sans text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Bagaskara Premium
            </span>
          </Link>
          <div className="pt-2">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Admin Login Panel
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Khusus pengelola toko Bagaskara Cell.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-md space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400 flex-shrink-0" />
                <input
                  id="username"
                  type="text"
                  placeholder="Masukkan username admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400 flex-shrink-0" />
                <input
                  id="password"
                  type="password"
                  placeholder="Masukkan password admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Error box */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-semibold text-rose-600 dark:text-rose-400 leading-normal">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-zinc-950 dark:border-t-transparent" />
                  <span>Mengecek Akses...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span>Masuk Ke Panel</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
