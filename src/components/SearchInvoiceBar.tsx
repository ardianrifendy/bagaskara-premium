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
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-0">
      {/* Box 1: Cari Layanan Premium */}
      <div className="group flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 shadow-md rounded-2xl md:rounded-full p-2.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
        <div className="flex items-center flex-1 px-3">
          <Search className="h-5 w-5 text-zinc-400 mr-3 flex-shrink-0 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari layanan premium (cth: Spotify, Netflix)..."
            value={search}
            onChange={handleSearchChange}
            className="w-full text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Box 2: Lacak Status Pesanan (Invoice) */}
      <form
        onSubmit={handleInvoiceCheck}
        className="group flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 shadow-md rounded-2xl md:rounded-full p-1.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500"
      >
        <div className="flex items-center flex-1 px-3">
          <FileText className="h-5 w-5 text-zinc-400 mr-3 flex-shrink-0 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Masukkan ID Invoice Anda (BGS-xxx)..."
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="w-full text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 font-mono tracking-wide"
          />
        </div>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 text-xs sm:text-sm font-bold rounded-xl md:rounded-full px-6 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px] flex-shrink-0 shadow-sm"
        >
          Lacak
        </button>
      </form>
    </div>
  );
}
