"use client";

import { useState, useMemo } from "react";
import SearchInvoiceBar from "./SearchInvoiceBar";
import ProductCard from "./ProductCard";
import SocialProofToast from "./SocialProofToast";

interface Category {
  id: number;
  name: string;
  slug: string;
  accentColor: string;
  sortOrder: number;
}

interface Product {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  tagline: string;
  badge: "HOT" | "AUTO" | "SMART" | null;
  iconUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface LandingClientProps {
  categories: Category[];
  products: Product[];
}

export default function LandingClient({ categories, products }: LandingClientProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Handler for category selection
  const handleCategorySelect = (slug: string) => {
    setSelectedCategorySlug(slug);
  };

  // Filter products based on category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Category Filter
      if (selectedCategorySlug !== "all") {
        const category = categories.find((c) => c.slug === selectedCategorySlug);
        if (!category || product.categoryId !== category.id) {
          return false;
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        return (
          product.name.toLowerCase().includes(q) ||
          product.tagline.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [products, categories, selectedCategorySlug, searchQuery]);

  return (
    <div className="relative pb-24">
      {/* Hero Section with Backdrop Gradients */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
        {/* Background radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.05),transparent_40%)]" />

        <div className="relative mx-auto max-w-4xl text-center space-y-6">
          {/* Green-pulsing badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 select-none shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            PLATFORM DIGITAL TERPERCAYA
          </div>

          {/* Headline */}
          <h1 className="font-sans text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            Akses Apps Premium,
            <br />
            <span className="text-emerald-600 dark:text-emerald-400 relative">
              Harga Bikin Hemat.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            Dapatkan akun premium 100% resmi dengan pengiriman instan otomatis 24 jam.
            Proses pembayaran mudah menggunakan QRIS dan jaminan garansi penuh untuk setiap pembelian.
          </p>

          {/* Search bar & Invoice checker */}
          <div className="pt-4" id="cek-invoice">
            <SearchInvoiceBar onSearch={setSearchQuery} />
          </div>
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
        {/* Category Pills Slider (Horizontal Scrollable on Mobile) */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 scrollbar-none gap-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* ALL Tab */}
          <button
            onClick={() => handleCategorySelect("all")}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              selectedCategorySlug === "all"
                ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Semua Produk
          </button>

          {/* Category Tabs */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.slug)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                selectedCategorySlug === category.slug
                  ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="mt-8">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30">
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
                Tidak ada layanan premium yang cocok dengan pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId)!;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={category.name}
                    categoryAccent={category.accentColor}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Floating Social Proof Toast */}
      <SocialProofToast />
    </div>
  );
}
