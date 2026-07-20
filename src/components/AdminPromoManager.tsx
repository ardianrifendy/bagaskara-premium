"use client";

import React, { useState } from "react";
import {
  Ticket,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Percent,
  Coins,
  X,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import CustomSelect from "./CustomSelect";
import CustomConfirmModal from "./CustomConfirmModal";
import CustomToast from "./CustomToast";
import { createPromoCode, updatePromoCode, deletePromoCode } from "@/app/actions/promo";

export interface PromoCodeItem {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

interface AdminPromoManagerProps {
  initialPromoCodes: PromoCodeItem[];
}

export default function AdminPromoManager({ initialPromoCodes }: AdminPromoManagerProps) {
  const [promos, setPromos] = useState<PromoCodeItem[]>(initialPromoCodes);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formMinPurchase, setFormMinPurchase] = useState<number>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>("");
  const [formUsageLimit, setFormUsageLimit] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formExpiresAt, setFormExpiresAt] = useState<string>("");

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ id: string; type: "success" | "error" | "info"; text: string } | null>(null);

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormCode("");
    setFormDiscountType("PERCENTAGE");
    setFormDiscountValue(10);
    setFormMinPurchase(0);
    setFormMaxDiscount("");
    setFormUsageLimit("");
    setFormIsActive(true);
    setFormExpiresAt("");
    setIsModalOpen(true);
  };

  const openEditModal = (promo: PromoCodeItem) => {
    setEditingPromo(promo);
    setFormCode(promo.code);
    setFormDiscountType(promo.discountType);
    setFormDiscountValue(promo.discountValue);
    setFormMinPurchase(promo.minPurchase);
    setFormMaxDiscount(promo.maxDiscount ? String(promo.maxDiscount) : "");
    setFormUsageLimit(promo.usageLimit !== null ? String(promo.usageLimit) : "");
    setFormIsActive(promo.isActive);
    setFormExpiresAt(
      promo.expiresAt ? new Date(promo.expiresAt).toISOString().split("T")[0] : ""
    );
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      code: formCode.trim().toUpperCase(),
      discountType: formDiscountType,
      discountValue: Number(formDiscountValue),
      minPurchase: Number(formMinPurchase) || 0,
      maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : null,
      usageLimit: formUsageLimit ? Number(formUsageLimit) : null,
      isActive: formIsActive,
      expiresAt: formExpiresAt ? formExpiresAt : null,
    };

    try {
      if (editingPromo) {
        const res = await updatePromoCode(editingPromo.id, payload);
        if (res.success) {
          setPromos((prev) =>
            prev.map((p) =>
              p.id === editingPromo.id
                ? {
                    ...p,
                    ...payload,
                    expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
                  }
                : p
            )
          );
          setToast({ id: Date.now().toString(), text: `Kode promo "${payload.code}" berhasil diperbarui!`, type: "success" });
          setIsModalOpen(false);
        } else {
          setToast({ id: Date.now().toString(), text: res.error || "Gagal memperbarui kode promo.", type: "error" });
        }
      } else {
        const res = await createPromoCode(payload);
        if (res.success) {
          setToast({ id: Date.now().toString(), text: `Kode promo "${payload.code}" berhasil dibuat!`, type: "success" });
          setIsModalOpen(false);
          // Refresh page or optimistic insert
          window.location.reload();
        } else {
          setToast({ id: Date.now().toString(), text: res.error || "Gagal membuat kode promo.", type: "error" });
        }
      }
    } catch (err: any) {
      setToast({ id: Date.now().toString(), text: "Terjadi kesalahan sistem.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);

    try {
      const res = await deletePromoCode(deletingId);
      if (res.success) {
        setPromos((prev) => prev.filter((p) => p.id !== deletingId));
        setToast({ id: Date.now().toString(), text: "Kode promo berhasil dihapus.", type: "success" });
      } else {
        setToast({ id: Date.now().toString(), text: res.error || "Gagal menghapus kode promo.", type: "error" });
      }
    } catch (err) {
      setToast({ id: Date.now().toString(), text: "Terjadi kesalahan sistem.", type: "error" });
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  // Filter promos
  const filteredPromos = promos.filter((p) => {
    const matchesQuery = p.code.toLowerCase().includes(searchQuery.toLowerCase().trim());

    const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date();
    const isLimitReached = p.usageLimit !== null && p.usedCount >= p.usageLimit;

    if (filterStatus === "ACTIVE") return matchesQuery && p.isActive && !isExpired && !isLimitReached;
    if (filterStatus === "INACTIVE") return matchesQuery && (!p.isActive || isExpired || isLimitReached);
    return matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      <CustomToast
        toast={toast}
        onClose={() => setToast(null)}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
            <Ticket className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span>Kelola Kode Promo & Diskon</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Buat kupon diskon persentase atau nominal flat untuk menarik pembeli.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Tambah Kode Promo</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Total Kode Promo
          </span>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{promos.length}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Promo Aktif
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {
              promos.filter(
                (p) =>
                  p.isActive &&
                  (!p.expiresAt || new Date(p.expiresAt) >= new Date()) &&
                  (p.usageLimit === null || p.usedCount < p.usageLimit)
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Total Digunakan
          </span>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {promos.reduce((acc, curr) => acc + curr.usedCount, 0)} kali
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari kode promo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent pl-10 pr-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-48">
          <CustomSelect
            options={[
              { value: "ALL", label: "Semua Status" },
              { value: "ACTIVE", label: "Hanya Aktif" },
              { value: "INACTIVE", label: "Nonaktif / Kadaluarsa" },
            ]}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
          />
        </div>
      </div>

      {/* Table Promo Codes */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">
                <th className="px-5 py-3.5 font-bold">Kode Promo</th>
                <th className="px-5 py-3.5 font-bold">Tipe & Diskon</th>
                <th className="px-5 py-3.5 font-bold">Min. Order</th>
                <th className="px-5 py-3.5 font-bold">Penggunaan</th>
                <th className="px-5 py-3.5 font-bold">Masa Berlaku</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {filteredPromos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-zinc-400 text-xs">
                    Belum ada kode promo ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPromos.map((promo) => {
                  const isExpired = promo.expiresAt && new Date(promo.expiresAt) < new Date();
                  const isLimitReached = promo.usageLimit !== null && promo.usedCount >= promo.usageLimit;
                  const isEffectiveActive = promo.isActive && !isExpired && !isLimitReached;

                  return (
                    <tr key={promo.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-xs font-mono font-black">
                          <Ticket className="h-3.5 w-3.5" />
                          <span>{promo.code}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                            {promo.discountType === "PERCENTAGE"
                              ? `${promo.discountValue}%`
                              : formatRupiah(promo.discountValue)}
                          </span>
                          {promo.discountType === "PERCENTAGE" && promo.maxDiscount && (
                            <span className="text-[10px] text-zinc-400">
                              Maks. {formatRupiah(promo.maxDiscount)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-zinc-600 dark:text-zinc-400">
                        {promo.minPurchase > 0 ? formatRupiah(promo.minPurchase) : "Tanpa Min."}
                      </td>

                      <td className="px-5 py-4 font-semibold text-zinc-700 dark:text-zinc-300">
                        {promo.usedCount} / {promo.usageLimit !== null ? promo.usageLimit : "∞"}
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-500">
                        {promo.expiresAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{new Date(promo.expiresAt).toLocaleDateString("id-ID")}</span>
                          </div>
                        ) : (
                          "Selamanya"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {isEffectiveActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Aktif
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Clock className="h-3 w-3" />
                            Kadaluarsa
                          </span>
                        ) : isLimitReached ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            <XCircle className="h-3 w-3" />
                            Kuota Habis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(promo)}
                            className="p-2 rounded-xl text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Edit Kode Promo"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(promo.id)}
                            className="p-2 rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Hapus Kode Promo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create & Edit Promo Code */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>{editingPromo ? "Edit Kode Promo" : "Tambah Kode Promo Baru"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Kode Promo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Kode Promo (Kapital & Tanpa Spasi)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BAGASKARA10, HEMAT5K"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  required
                  className="w-full text-sm font-mono font-bold rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Grid 2 kolom: Tipe & Nilai Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Tipe Diskon
                  </label>
                  <CustomSelect
                    options={[
                      { value: "PERCENTAGE", label: "Persentase (%)", sublabel: "Diskon % dari harga" },
                      { value: "FLAT", label: "Nominal Flat (Rp)", sublabel: "Potongan Rp tetap" },
                    ]}
                    value={formDiscountType}
                    onChange={(val) => setFormDiscountType(val)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Nilai Diskon ({formDiscountType === "PERCENTAGE" ? "%" : "Rp"})
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder={formDiscountType === "PERCENTAGE" ? "Contoh: 10" : "Contoh: 5000"}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    required
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Grid 2 kolom: Min Order & Max Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Minimal Pembelian (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 = Tanpa minimal"
                    value={formMinPurchase}
                    onChange={(e) => setFormMinPurchase(Number(e.target.value))}
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Maksimal Diskon Rp (Opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Kosongkan jika unlimited"
                    disabled={formDiscountType === "FLAT"}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Grid 2 kolom: Kuota & Tanggal Kadaluarsa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Batas Kuota Penggunaan (Opsional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Kosongkan jika tak terbatas"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Tanggal Kadaluarsa (Opsional)
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Status Kode Promo
                </label>
                <CustomSelect
                  options={[
                    { value: "true", label: "Aktif (Bisa Digunakan)" },
                    { value: "false", label: "Nonaktif (Diarsipkan)" },
                  ]}
                  value={formIsActive ? "true" : "false"}
                  onChange={(val) => setFormIsActive(val === "true")}
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : editingPromo ? "Simpan Perubahan" : "Buat Kode Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingId && (
        <CustomConfirmModal
          isOpen={!!deletingId}
          title="Hapus Kode Promo"
          message="Apakah Anda yakin ingin menghapus kode promo ini secara permanen?"
          confirmText={deleting ? "Menghapus..." : "Hapus Permanen"}
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
