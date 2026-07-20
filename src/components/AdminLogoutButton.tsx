"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAdmin } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari panel admin?")) return;
    setLoading(true);

    try {
      const res = await logoutAdmin();
      if (res.success) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 px-4 text-xs font-bold text-rose-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
      aria-label="Logout dari panel admin"
    >
      <LogOut className="h-4 w-4" />
      <span>{loading ? "Keluar..." : "Logout"}</span>
    </button>
  );
}
