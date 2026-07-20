"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/order";
import { formatRupiah } from "@/lib/format";
import ProductIcon from "./ProductIcon";
import { MessageSquare, CircleAlert, Sparkles, Send, ArrowLeft, ShieldCheck, Mail, Phone, FileText, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Variant {
  id: number;
  name: string;
  durationDays: number;
  price: number;
  comparePrice: number | null;
  resellerPrice: number | null;
  deliveryMode: "AUTO_STOCK" | "MANUAL_INVITE" | "PROVIDER_API";
  warrantyDays: number;
  isActive: boolean;
  stockCount: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  iconUrl?: string | null;
  badge: "HOT" | "AUTO" | "SMART" | null;
}

interface Category {
  id: number;
  name: string;
  accentColor: string;
}

interface ProductOrderClientProps {
  product: Product;
  variants: Variant[];
  category: Category;
}

export default function ProductOrderClient({ product, variants, category }: ProductOrderClientProps) {
  const router = useRouter();

  // Auto-select first variant that has stock available
  const defaultAvailableVariant = variants.find(
    (v) => v.deliveryMode !== "AUTO_STOCK" || (v.stockCount ?? 0) > 0
  ) || variants[0];

  const [selectedVariantId, setSelectedVariantId] = useState<number>(defaultAvailableVariant?.id || 0);
  const [waNumber, setWaNumber] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map category accent color to Tailwind text class
  const accentClasses: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50",
  };

  const badgeClass = accentClasses[category.accentColor] || "text-zinc-600 bg-zinc-50 border-zinc-200";

  // Find currently selected variant details
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedVariantIsOutOfStock =
    selectedVariant?.deliveryMode === "AUTO_STOCK" && (selectedVariant?.stockCount ?? 0) <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId || selectedVariantIsOutOfStock) return;

    setError(null);
    setLoading(true);

    try {
      const response = await createOrder({
        variantId: selectedVariantId,
        waNumber,
        email,
        note: note.trim() || null,
      });

      if (response.success && response.orderId) {
        // Success -> redirect to invoice page
        router.push(`/invoice/${response.orderId}`);
      } else {
        setError(response.error || "Terjadi kesalahan saat memproses pesanan.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Kesalahan sistem. Silakan coba beberapa saat lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back to Home Link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm transition-colors">
            {/* Header info with Icon */}
            <div className="flex flex-col items-center text-center space-y-4">
              <ProductIcon name={product.name} iconUrl={product.iconUrl} size={100} />
              <div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${badgeClass}`}>
                  {category.name}
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mt-2">
                  {product.name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                  {product.tagline}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Deskripsi Layanan
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Warranty & trust badge */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex items-start gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Garansi Terjamin</p>
                <p className="leading-normal">Setiap pembelian memiliki jaminan garansi penuh sesuai durasi aktif varian yang dipilih.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Varian & Form Order */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Choose Varian */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm transition-colors">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-xs font-bold text-white dark:text-zinc-950">
                  1
                </span>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Pilih Varian Layanan
                </h2>
              </div>

              {/* Grid Varian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {variants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;
                  const isAuto = variant.deliveryMode === "AUTO_STOCK";
                  const stock = variant.stockCount ?? 0;
                  const isOutOfStock = isAuto && stock <= 0;

                  return (
                    <label
                      key={variant.id}
                      onClick={() => {
                        if (!isOutOfStock) {
                          setSelectedVariantId(variant.id);
                        }
                      }}
                      className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 select-none ${
                        isOutOfStock
                          ? "opacity-60 bg-zinc-100/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
                          : isSelected
                          ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10 ring-2 ring-emerald-500 cursor-pointer"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="variant"
                        value={variant.id}
                        disabled={isOutOfStock}
                        checked={isSelected}
                        onChange={() => {
                          if (!isOutOfStock) {
                            setSelectedVariantId(variant.id);
                          }
                        }}
                        className="sr-only"
                      />

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                            Durasi {variant.durationDays} Hari
                          </span>

                          {/* Stock Status Badge */}
                          {isAuto ? (
                            stock > 0 ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Stok: {stock}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/60 px-2.5 py-0.5 rounded-full">
                                <Ban className="h-3 w-3" />
                                Stok Habis
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3 text-blue-500" />
                              Stok Ready
                            </span>
                          )}
                        </div>

                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block pt-0.5">
                          {variant.name}
                        </span>

                        {/* Delivery badge */}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold mt-1.5 ${
                            isAuto
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30"
                              : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30"
                          }`}
                        >
                          {isAuto ? "Kirim Otomatis (Instan)" : "Diproses 5-30 mnt"}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-baseline justify-between">
                        <div className="flex flex-col">
                          {variant.comparePrice && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through">
                              {formatRupiah(variant.comparePrice)}
                            </span>
                          )}
                          <span className={`text-base font-extrabold ${isOutOfStock ? "text-zinc-400 dark:text-zinc-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {formatRupiah(variant.price)}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          Garansi {variant.warrantyDays} Hari
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Customer Details */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm transition-colors">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-xs font-bold text-white dark:text-zinc-950">
                  2
                </span>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Data Pembeli & Kontak
                </h2>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label htmlFor="wa-number" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Nomor WhatsApp CS/Penerima
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400 flex-shrink-0" />
                    <input
                      id="wa-number"
                      type="text"
                      placeholder="Contoh: 08123456789 atau 628123456789"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      required
                      className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal pl-2">
                    Digunakan untuk pengiriman notifikasi status order dan klaim garansi.
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Alamat Email Aktif
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400 flex-shrink-0" />
                    <input
                      id="email"
                      type="email"
                      placeholder="Contoh: email-anda@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal pl-2">
                    Data login akun premium atau detail instruksi manual akan dikirimkan juga ke email Anda.
                  </p>
                </div>

                {/* Optional Note */}
                <div className="space-y-1.5">
                  <label htmlFor="note" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Catatan untuk Admin (Opsional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400 flex-shrink-0" />
                    <textarea
                      id="note"
                      placeholder="Tulis catatan jika ada permintaan khusus (maks. 200 karakter)..."
                      value={note}
                      onChange={(e) => setNote(e.target.value.slice(0, 200))}
                      rows={2}
                      className="w-full text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Payment Summary & Submit */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Ringkasan Pembayaran
                </h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Metode: QRIS Dinamis
                </span>
              </div>

              {selectedVariant && (
                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>{product.name} ({selectedVariant.name})</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {formatRupiah(selectedVariant.price)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    <span>Total Pembayaran</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(selectedVariant.price)}
                    </span>
                  </div>
                </div>
              )}

              {/* Out of Stock Warning Banner */}
              {selectedVariantIsOutOfStock && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/40 text-xs font-bold text-rose-600 dark:text-rose-400 leading-normal">
                  <CircleAlert className="h-4 w-4 flex-shrink-0" />
                  <span>Stok untuk varian yang Anda pilih sedang habis. Silakan pilih varian lain atau hubungi CS.</span>
                </div>
              )}

              {/* Error box */}
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-semibold text-rose-600 dark:text-rose-400 leading-normal">
                  <CircleAlert className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !selectedVariantId || selectedVariantIsOutOfStock}
                className="w-full inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-zinc-950 dark:border-t-transparent" />
                    <span>Memproses Transaksi...</span>
                  </div>
                ) : selectedVariantIsOutOfStock ? (
                  <div className="flex items-center gap-2 text-white dark:text-zinc-950 font-bold">
                    <Ban className="h-4 w-4" />
                    <span>Stok Varian Habis</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    <span>Bayar dengan QRIS</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
