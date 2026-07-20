"use client";

import React, { useState, useMemo, useEffect } from "react";
import { bulkAddStock, updateStockStatus, deleteStock } from "@/app/actions/stock";
import { getSupplierProductsAction } from "@/app/actions/supplier";
import { Plus, Trash2, ShieldAlert, CircleCheck, CheckCircle2, ClipboardCopy, CircleAlert, Eye, EyeOff, Globe, RefreshCw, Link2, Server } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import CustomSelect from "./CustomSelect";

interface Variant {
  id: number;
  productId: number;
  productName: string;
  name: string;
  supplierProductId?: string | null;
}

interface StockItem {
  id: number;
  variantId: number;
  payloadJson: any; // { email, password/pass, profile, pin, note }
  status: "AVAILABLE" | "SOLD" | "PROBLEM";
  soldOrderId: string | null;
  createdAt: string;
}

interface AdminStockManagerProps {
  variants: Variant[];
  stockItems: StockItem[];
  defaultSelectedVariantId?: number;
}

interface ParsedStock {
  email: string;
  password: string;
  profile: string;
  pin: string;
  note: string;
  isValid: boolean;
}

export default function AdminStockManager({
  variants,
  stockItems,
  defaultSelectedVariantId,
}: AdminStockManagerProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    defaultSelectedVariantId || variants[0]?.id || 0
  );
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "SOLD" | "PROBLEM">("ALL");

  // View tabs
  const [viewTab, setViewTab] = useState<"LOCAL" | "SUPPLIER">("LOCAL");
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState<string | null>(null);

  // Bulk Import State
  const [bulkText, setBulkText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (viewTab === "SUPPLIER" && supplierProducts.length === 0) {
      loadSupplierProducts();
    }
  }, [viewTab]);

  const loadSupplierProducts = async () => {
    setSupplierLoading(true);
    setSupplierError(null);
    try {
      const res = await getSupplierProductsAction();
      if (res.success && res.products) {
        setSupplierProducts(res.products);
      } else {
        setSupplierError(res.error || "Gagal memuat produk dari API Supplier.");
      }
    } catch (err: any) {
      setSupplierError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setSupplierLoading(false);
    }
  };

  // Parse raw text dynamically
  const parsedItems = useMemo<ParsedStock[]>(() => {
    if (!bulkText.trim()) return [];

    const lines = bulkText.split("\n");
    const result: ParsedStock[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split("|");
      const email = parts[0]?.trim() || "";
      const password = parts[1]?.trim() || "";
      const profile = parts[2]?.trim() || "-";
      const pin = parts[3]?.trim() || "-";
      const note = parts[4]?.trim() || "";

      result.push({
        email,
        password,
        profile: profile || "-",
        pin: pin || "-",
        note,
        isValid: email.length > 0 && password.length > 0,
      });
    }

    return result;
  }, [bulkText]);

  // Submit bulk imports
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) return;

    const validItems = parsedItems.filter((item) => item.isValid);
    if (validItems.length === 0) {
      setError("Tidak ada data akun yang valid untuk disimpan.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const formattedItems = validItems.map((item) => ({
      email: item.email,
      password: item.password!,
      profile: item.profile,
      pin: item.pin,
      note: item.note,
    }));

    try {
      const res = await bulkAddStock({
        variantId: selectedVariantId,
        items: formattedItems,
      });

      if (res.success) {
        setSuccessMsg(`Berhasil menambahkan ${res.count} stok akun.`);
        setBulkText("");
      } else {
        setError(res.error || "Gagal menyimpan stok.");
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  // Status changers
  const handleStatusToggle = async (id: number, currentStatus: "AVAILABLE" | "SOLD" | "PROBLEM") => {
    const nextStatus = currentStatus === "PROBLEM" ? "AVAILABLE" : "PROBLEM";
    const res = await updateStockStatus(id, nextStatus);
    if (!res.success) alert(res.error);
  };

  const handleStockDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus stok akun ini?")) return;
    const res = await deleteStock(id);
    if (!res.success) alert(res.error);
  };

  // Filtered Stock List for Display
  const filteredStocks = useMemo(() => {
    return stockItems.filter((stock) => {
      // 1. Filter by Variant
      if (stock.variantId !== selectedVariantId) return false;

      // 2. Filter by Status
      if (statusFilter !== "ALL" && stock.status !== statusFilter) return false;

      return true;
    });
  }, [stockItems, selectedVariantId, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setViewTab("LOCAL")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
            viewTab === "LOCAL"
              ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 border-emerald-600 dark:border-emerald-500"
              : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-850 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Stok Lokal (Manual)</span>
        </button>
        <button
          type="button"
          onClick={() => setViewTab("SUPPLIER")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
            viewTab === "SUPPLIER"
              ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 border-emerald-600 dark:border-emerald-500"
              : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-850 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Katalog API Supplier</span>
        </button>
      </div>

      {viewTab === "LOCAL" ? (
        <div className="space-y-8">
      {/* Importer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bulk Area input (1 Column) */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <ClipboardCopy className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            Bulk Paste Akun
          </h2>

          <form onSubmit={handleBulkSubmit} className="space-y-4">
            {/* Select Varian */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Varian Target</label>
              <CustomSelect
                options={variants.map((v) => ({
                  value: v.id,
                  label: `${v.productName} (${v.name})`,
                }))}
                value={selectedVariantId}
                onChange={(val) => setSelectedVariantId(Number(val))}
              />
            </div>

            {/* Paste Textarea */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Tempel Data Akun</label>
                <span className="text-zinc-400">email|password|profil|pin|catatan</span>
              </div>
              <textarea
                placeholder="netflix-1@gmail.com|passWord123|Profil 1|1029|Dilarang edit profile&#10;netflix-2@gmail.com|passWord456|Profil 2|2048|Tolong tertib"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={6}
                required
                className="w-full text-xs rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono resize-none leading-relaxed"
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <CircleAlert className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || parsedItems.length === 0}
              className="w-full inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-955 dark:hover:bg-emerald-400 transition-colors duration-200 disabled:opacity-50 select-none"
            >
              {loading ? "Menyimpan..." : `Simpan ${parsedItems.filter(i => i.isValid).length} Akun`}
            </button>
          </form>
        </div>

        {/* Live Preview List (2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Preview Impor ({parsedItems.length} Terdeteksi)
            </h2>
            <p className="text-xs text-zinc-400">
              Berikut adalah hasil parsing instan dari text yang ditempel di sebelah kiri.
            </p>
          </div>

          <div className="flex-grow overflow-y-auto max-h-[300px] border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 p-2 mt-2">
            {parsedItems.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 text-xs select-none">
                Tempel data di sebelah kiri untuk melihat preview parsing.
              </div>
            ) : (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-bold">
                    <th className="px-2 py-1.5">Email</th>
                    <th className="px-2 py-1.5">Password</th>
                    <th className="px-2 py-1.5">Profil/PIN</th>
                    <th className="px-2 py-1.5">Catatan</th>
                    <th className="px-2 py-1.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-mono text-zinc-600 dark:text-zinc-400">
                  {parsedItems.map((item, idx) => (
                    <tr key={idx} className={item.isValid ? "" : "bg-rose-50/50 dark:bg-rose-950/20 text-rose-500"}>
                      <td className="px-2 py-2 truncate max-w-28">{item.email || "(Kosong)"}</td>
                      <td className="px-2 py-2 truncate max-w-24">{item.password || "(Kosong)"}</td>
                      <td className="px-2 py-2">
                        {item.profile}/{item.pin}
                      </td>
                      <td className="px-2 py-2 truncate max-w-24">{item.note || "-"}</td>
                      <td className="px-2 py-2 text-right">
                        {item.isValid ? (
                          <span className="text-emerald-600 dark:text-emerald-500 font-bold">OK</span>
                        ) : (
                          <span className="text-rose-600 font-bold">Error</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* STOCK LIST & INVENTORY FILTER */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Inventori & Stok Akun
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Daftar stok akun untuk varian terpilih di database.
            </p>
          </div>

          {/* Filter status */}
          <div className="flex flex-wrap gap-2 text-xs">
            {(["ALL", "AVAILABLE", "SOLD", "PROBLEM"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-1.5 rounded-full font-semibold transition-all border ${
                  statusFilter === filter
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold border-emerald-600 dark:border-emerald-500"
                    : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
                }`}
              >
                {filter === "ALL" ? "Semua Status" : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Stock table */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Email / Username</th>
                  <th className="px-4 py-3 font-semibold">Password</th>
                  <th className="px-4 py-3 font-semibold">Profil / PIN</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Order Terjual</th>
                  <th className="px-4 py-3 font-semibold">Ditambahkan</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] sm:text-xs">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 font-sans">
                      Tidak ada stok akun dengan filter terpilih.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => {
                    const payload = stock.payloadJson as Record<string, any>;
                    const email = payload.email || "-";
                    const pass = payload.password || payload.pass || "-";
                    const profile = payload.profile || "-";
                    const pin = payload.pin || "-";

                    return (
                      <tr key={stock.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-850/10">
                        <td className="px-4 py-3.5 text-zinc-400 font-sans">{stock.id}</td>
                        <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-zinc-100 font-mono select-all">
                          {email}
                        </td>
                        <td className="px-4 py-3.5 font-mono select-all">{pass}</td>
                        <td className="px-4 py-3.5">
                          {profile} / {pin}
                        </td>
                        <td className="px-4 py-3.5 font-sans">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                              stock.status === "AVAILABLE"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : stock.status === "SOLD"
                                ? "bg-zinc-100 text-zinc-500 border-zinc-200/50 dark:bg-zinc-800 dark:text-zinc-400"
                                : "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400"
                            }`}
                          >
                            {stock.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-sans select-all">
                          {stock.soldOrderId ? (
                            <a
                              href={`/admin/order?search=${stock.soldOrderId}`}
                              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                            >
                              {stock.soldOrderId}
                            </a>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-400 font-sans font-medium">
                          {formatDateTime(stock.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1 sm:space-x-2 font-sans">
                          {stock.status !== "SOLD" && (
                            <button
                              onClick={() => handleStatusToggle(stock.id, stock.status)}
                              className={`inline-flex h-8 items-center justify-center gap-1 rounded-full px-3 text-[10px] font-bold transition-colors ${
                                stock.status === "PROBLEM"
                                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400"
                              }`}
                            >
                              {stock.status === "PROBLEM" ? (
                                <>
                                  <CircleCheck className="h-3.5 w-3.5" />
                                  <span>Set Aman</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                  <span>Tandai Problem</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleStockDelete(stock.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 inline-block align-middle"
                            aria-label="Hapus stok"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
        </div>
      ) : (
        /* Render Supplier Catalog */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Katalog Produk API Supplier
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Data produk ter-update yang ditarik langsung dari server reseller API supplier.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSupplierProducts}
              disabled={supplierLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 px-4 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors disabled:opacity-50 select-none"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${supplierLoading ? "animate-spin" : ""}`} />
              <span>Muat Ulang</span>
            </button>
          </div>

          {supplierLoading ? (
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 dark:text-emerald-500 animate-spin" />
              <p className="text-xs text-zinc-400">Menghubungkan ke API Supplier...</p>
            </div>
          ) : supplierError ? (
            <div className="rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-955/10 p-6 flex items-center gap-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <CircleAlert className="h-5 w-5 flex-shrink-0" />
              <span>{supplierError}</span>
            </div>
          ) : supplierProducts.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-zinc-400 text-xs">
              Belum ada produk yang dimuat. Pastikan API key sudah dikonfigurasi.
            </div>
          ) : (
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="px-4 py-3">ID Produk Supplier</th>
                      <th className="px-4 py-3">Nama Layanan</th>
                      <th className="px-4 py-3">Harga (USD)</th>
                      <th className="px-4 py-3">Status Stok</th>
                      <th className="px-4 py-3">Kategori Supplier</th>
                      <th className="px-4 py-3 text-right">Varian Terhubung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] sm:text-xs">
                    {supplierProducts.map((p) => {
                      // Find if any variant is linked to this product ID
                      const linkedVariants = variants.filter(v => v.supplierProductId === p.id);

                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-850/10">
                          <td className="px-4 py-3.5 text-zinc-400 select-all">{p.id}</td>
                          <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                            {p.name}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            ${p.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 font-sans">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                p.inStock
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-955/20 dark:text-rose-400"
                              }`}
                            >
                              {p.inStock ? "Ready" : "Habis"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-zinc-400 font-sans">{p.category || "-"}</td>
                          <td className="px-4 py-3.5 text-right font-sans">
                            {linkedVariants.length > 0 ? (
                              <div className="flex flex-col items-end gap-1">
                                {linkedVariants.map((lv) => (
                                  <span key={lv.id} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full border border-emerald-200/30">
                                    <Link2 className="h-3 w-3" />
                                    {lv.productName} ({lv.name})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-400 font-semibold italic">Belum terhubung</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
