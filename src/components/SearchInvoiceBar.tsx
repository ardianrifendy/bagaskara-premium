"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText } from "lucide-react";

interface SearchInvoiceBarProps {
  onSearch?: (value: string) => void;
}

export default function SearchInvoiceBar({ onSearch }: SearchInvoiceBarProps) {
  const [search, setSearch] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const router = useRouter();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const handleInvoiceCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId.trim()) return;

    // Normalize input (uppercase, e.g. BGS-XXXXXXXX)
    const cleanId = invoiceId.trim().toUpperCase();

    // Redirect to invoice page
    router.push(`/invoice/${cleanId}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm sm:rounded-full rounded-2xl p-1.5 transition-colors duration-200">
        {/* Search Product Input */}
        <div className="relative flex-1 w-full flex items-center px-3 py-2 sm:py-1">
          <Search className="h-4 w-4 text-zinc-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari layanan (cth: Spotify)..."
            value={search}
            onChange={handleSearchChange}
            className="w-full text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>

        {/* Separator on desktop */}
        <div className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Invoice Checker Form */}
        <form
          onSubmit={handleInvoiceCheck}
          className="flex-1 w-full flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 sm:border-t-0 mt-1 sm:mt-0 pt-2 sm:pt-0 pl-3 pr-1 pb-1 sm:pb-0"
        >
          <div className="flex items-center flex-1 mr-2">
            <FileText className="h-4 w-4 text-zinc-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari ID Invoice (BGS-xxx)..."
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 text-sm font-bold rounded-full px-5 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          >
            Cek
          </button>
        </form>
      </div>
    </div>
  );
}
