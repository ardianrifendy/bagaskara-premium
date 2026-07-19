"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const nextDark = !isDark;

    if (nextDark) {
      html.classList.add("dark");
      document.cookie = "theme=dark; path=/; max-age=31536000; SameSite=Lax";
    } else {
      html.classList.remove("dark");
      document.cookie = "theme=light; path=/; max-age=31536000; SameSite=Lax";
    }

    setIsDark(nextDark);
  };

  if (!mounted) {
    // Placeholder to avoid layout shift and hydration mismatch
    return (
      <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
      aria-label={isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-500 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-zinc-600 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
