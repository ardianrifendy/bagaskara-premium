"use client";

import React, { useState, useMemo } from "react";
import { fulfillOrderManual, refundOrderManual, confirmPaymentManual, cancelOrderAdmin } from "@/app/actions/admin-order";
import { formatRupiah, formatDateTime, formatDate } from "@/lib/format";
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  X,
  CreditCard,
  CircleAlert,
  Send,
  Ban,
  ExternalLink,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import CustomConfirmModal from "./CustomConfirmModal";
import CustomToast, { ToastMessage } from "./CustomToast";
import EmptyState from "./EmptyState";
import CustomSelect from "./CustomSelect";

interface Order {
  id: string;
  variantId: number;
  productNameSnap: string;
  variantNameSnap: string;
  price: number;
  waNumber: string;
  email: string;
  note: string | null;
  status: "PENDING" | "PAID" | "PROCESSING" | "DELIVERED" | "EXPIRED" | "FAILED" | "REFUNDED";
  statusChangedBy: string | null;
  statusChangedAt: string | null;
  paymentRef: string;
  paymentQrUrl: string;
  expiredAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

interface Delivery {
  id: number;
  orderId: string;
  payloadJson: any; // { email, password/pass, profile, pin, note }
  warrantyUntil: string;
  createdAt: string;
}

interface AdminOrderManagerProps {
  orders: Order[];
  deliveries: Delivery[];
  defaultSearchQuery?: string;
}

export default function AdminOrderManager({
  orders,
  deliveries,
  defaultSearchQuery = "",
}: AdminOrderManagerProps) {
  const [search, setSearch] = useState(defaultSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Details Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fulfill Modal state
  const [fulfillOrder, setFulfillOrder] = useState<Order | null>(null);
  const [emailField, setEmailField] = useState("");
  const [passwordField, setPasswordField] = useState("");
  const [profileField, setProfileField] = useState("-");
  const [pinField, setPinField] = useState("-");
  const [noteField, setNoteField] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync details if selectedOrder is fulfills
  const matchedDelivery = useMemo(() => {
    if (!selectedOrder) return null;
    return deliveries.find((d) => d.orderId === selectedOrder.id) || null;
  }, [selectedOrder, deliveries]);

  // Filters & searches
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;

      // 2. Search query (matches ID or WA)
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return o.id.toLowerCase().includes(q) || o.waNumber.includes(q) || o.email.toLowerCase().includes(q);
      }

      return true;
    });
  }, [orders, statusFilter, search]);

  const handleFulfillOpen = (order: Order) => {
    setFulfillOrder(order);
    setEmailField(order.email); // Auto-fill with user email as suggestion
    setPasswordField("");
    setProfileField("-");
    setPinField("-");
    setNoteField("");
    setError(null);
  };

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillOrder) return;

    setLoading(true);
    setError(null);

    const res = await fulfillOrderManual({
      orderId: fulfillOrder.id,
      email: emailField,
      password: passwordField,
      profile: profileField,
      pin: pinField,
      note: noteField,
    });

    setLoading(false);
    if (res.success) {
      setFulfillOrder(null);
    } else {
      setError(res.error || "Gagal memproses fulfillment.");
    }
  };

  // Pagination & Custom Modal State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
  } | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  const handleRefund = (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Refund Pesanan",
      message: `Apakah Anda yakin ingin merubah status order ${orderId} menjadi REFUNDED?`,
      variant: "warning",
      onConfirm: async () => {
        setConfirmModal(null);
        setLoading(true);
        const res = await refundOrderManual(orderId);
        setLoading(false);
        if (res.success) {
          setSelectedOrder(null);
          showToast("success", "Status order berhasil diubah ke REFUNDED.");
        } else {
          showToast("error", res.error || "Gagal melakukan refund.");
        }
      },
    });
  };

  const handleConfirmPayment = (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Pembayaran Manual",
      message: `Apakah Anda yakin sudah menerima pembayaran penuh untuk ID Invoice ${orderId}?`,
      variant: "info",
      onConfirm: async () => {
        setConfirmModal(null);
        setLoading(true);
        setError(null);
        try {
          const res = await confirmPaymentManual(orderId);
          if (res.success) {
            showToast("success", "Pembayaran berhasil dikonfirmasi!");
          } else {
            showToast("error", res.error || "Gagal mengonfirmasi pembayaran.");
          }
        } catch (err: any) {
          showToast("error", err?.message || "Terjadi kesalahan koneksi.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleCancelOrder = (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Batalkan Pesanan",
      message: `Apakah Anda yakin ingin membatalkan pesanan dengan ID Invoice ${orderId}? Status akan diubah menjadi EXPIRED.`,
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        setLoading(true);
        setError(null);
        try {
          const res = await cancelOrderAdmin(orderId);
          if (res.success) {
            setSelectedOrder(null);
            showToast("success", "Pesanan berhasil dibatalkan.");
          } else {
            showToast("error", res.error || "Gagal membatalkan pesanan.");
          }
        } catch (err: any) {
          showToast("error", err?.message || "Terjadi kesalahan koneksi.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Export Sales CSV Report
  const exportSalesCSV = () => {
    if (filteredOrders.length === 0) {
      showToast("info", "Tidak ada data transaksi untuk diekspor.");
      return;
    }

    const headers = ["Invoice ID", "Produk", "Varian", "Harga (Rp)", "WA Pembeli", "Email Pembeli", "Status", "Tanggal"];
    const rows = filteredOrders.map((o) =>
      [
        o.id,
        `"${o.productNameSnap}"`,
        `"${o.variantNameSnap}"`,
        o.price,
        `"${o.waNumber}"`,
        `"${o.email}"`,
        o.status,
        `"${o.createdAt}"`,
      ].join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_penjualan_bagaskara_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Laporan penjualan CSV berhasil diunduh.");
  };

  // Paginated Orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // Helper styles for statuses
  const statusBadges: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-600 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400",
    PAID: "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400",
    PROCESSING: "bg-blue-50 text-blue-600 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400",
    DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400",
    EXPIRED: "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400",
    FAILED: "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400",
    REFUNDED: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Kelola Transaksi Order
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Daftar seluruh transaksi masuk. Verifikasi detail pembayaran, proses order manual, atau kelola refund.
        </p>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari ID Invoice, WA, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[38px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export Sales CSV */}
          <button
            onClick={exportSalesCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
            <span>Ekspor Laporan CSV</span>
          </button>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <Filter className="h-4 w-4 text-zinc-400 flex-shrink-0" />
            <CustomSelect
              options={[
                { value: "ALL", label: "Semua Status" },
                { value: "PENDING", label: "PENDING" },
                { value: "PAID", label: "PAID" },
                { value: "PROCESSING", label: "PROCESSING" },
                { value: "DELIVERED", label: "DELIVERED" },
                { value: "EXPIRED", label: "EXPIRED" },
                { value: "FAILED", label: "FAILED" },
                { value: "REFUNDED", label: "REFUNDED" },
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3 font-semibold">ID Invoice</th>
                <th className="px-4 py-3 font-semibold">Layanan</th>
                <th className="px-4 py-3 font-semibold">Pelanggan</th>
                <th className="px-4 py-3 font-semibold">Harga</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] sm:text-xs">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <EmptyState
                      title="Transaksi Tidak Ditemukan"
                      description="Belum ada transaksi order yang sesuai dengan filter atau kata kunci pencarian Anda."
                    />
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-850/10">
                    <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-zinc-100 select-all font-mono">
                      {o.id}
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      <span className="font-bold block">{o.productNameSnap}</span>
                      <span className="text-[10px] text-zinc-450 block">{o.variantNameSnap}</span>
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      <span className="block font-mono">{o.waNumber}</span>
                      <span className="text-[10px] text-zinc-400 font-mono block">{o.email}</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-right select-all font-mono">
                      {formatRupiah(o.price)}
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          statusBadges[o.status] || "bg-zinc-50"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400 font-sans font-medium">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2 font-sans">
                      {o.status === "PENDING" && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleConfirmPayment(o.id)}
                            disabled={loading}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-amber-600 hover:bg-amber-500 px-3 text-[11px] font-bold text-white transition-colors disabled:opacity-50"
                          >
                            Konfirmasi Bayar
                          </button>
                          <button
                            onClick={() => handleCancelOrder(o.id)}
                            disabled={loading}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-rose-600 hover:bg-rose-500 px-3 text-[11px] font-bold text-white transition-colors disabled:opacity-50"
                          >
                            Batalkan
                          </button>
                        </div>
                      )}
                      {o.status === "PROCESSING" && (
                        <button
                          onClick={() => handleFulfillOpen(o)}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-500 px-3 text-[11px] font-bold text-white transition-colors"
                        >
                          Fulfill
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 inline-block align-middle"
                        aria-label="Lihat detail order"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/30 text-xs text-zinc-500">
            <span>
              Halaman {currentPage} dari {totalPages} ({filteredOrders.length} total transaksi)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: ORDER DETAILS VIEW */}
      {/* ---------------------------------------------------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-6 space-y-5 shadow-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Detail Transaksi: {selectedOrder.id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content summary */}
            <div className="space-y-4 text-xs">
              {/* Product */}
              <div className="grid grid-cols-2">
                <span className="text-zinc-400">Produk Layanan</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedOrder.productNameSnap} - {selectedOrder.variantNameSnap}
                </span>
              </div>

              {/* WA */}
              <div className="grid grid-cols-2">
                <span className="text-zinc-400">WhatsApp Pelanggan</span>
                <span className="font-mono font-semibold text-zinc-850 dark:text-zinc-200">
                  {selectedOrder.waNumber}
                </span>
              </div>

              {/* Email */}
              <div className="grid grid-cols-2">
                <span className="text-zinc-400">Email Pelanggan</span>
                <span className="font-mono font-semibold text-zinc-850 dark:text-zinc-200">
                  {selectedOrder.email}
                </span>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2">
                <span className="text-zinc-400">Total Nominal</span>
                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(selectedOrder.price)}
                </span>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2">
                <span className="text-zinc-400">Status Saat Ini</span>
                <span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      statusBadges[selectedOrder.status]
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </span>
              </div>

              {/* Notes */}
              {selectedOrder.note && (
                <div className="flex flex-col gap-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-2 text-left">
                  <span className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider">Catatan Klien:</span>
                  <p className="bg-zinc-50 dark:bg-zinc-950/20 p-2.5 rounded-lg text-zinc-600 dark:text-zinc-400 font-sans italic border border-zinc-100 dark:border-zinc-800/50">
                    &quot;{selectedOrder.note}&quot;
                  </p>
                </div>
              )}

              {/* CRITICAL RULE 9 METADATA TRACE */}
              <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-3 space-y-2">
                <span className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider block">
                  Riwayat Perubahan Status (Rule 9 Audit)
                </span>
                <div className="grid grid-cols-2 bg-zinc-50 dark:bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 text-[11px] leading-relaxed">
                  <span className="text-zinc-400">Diubah Oleh:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {selectedOrder.statusChangedBy || "Sistem / Gateway"}
                  </span>
                  <span className="text-zinc-400">Diubah Pada:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {selectedOrder.statusChangedAt ? formatDateTime(selectedOrder.statusChangedAt) : "-"}
                  </span>
                </div>
              </div>

              {/* Delivery snapshot if status is DELIVERED */}
              {selectedOrder.status === "DELIVERED" && matchedDelivery && (
                <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-3 space-y-2">
                  <span className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider block">
                    Kredensial Akun Terkirim (Snapshot)
                  </span>
                  <div className="bg-zinc-50 dark:bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 space-y-1 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                    <div>• <strong>Email:</strong> {matchedDelivery.payloadJson.email}</div>
                    <div>• <strong>Password:</strong> {matchedDelivery.payloadJson.password || matchedDelivery.payloadJson.pass || "-"}</div>
                    {matchedDelivery.payloadJson.profile && matchedDelivery.payloadJson.profile !== "-" && (
                      <div>• <strong>Profil:</strong> {matchedDelivery.payloadJson.profile}</div>
                    )}
                    {matchedDelivery.payloadJson.pin && matchedDelivery.payloadJson.pin !== "-" && (
                      <div>• <strong>PIN:</strong> {matchedDelivery.payloadJson.pin}</div>
                    )}
                    {matchedDelivery.payloadJson.note && (
                      <div>• <strong>Catatan:</strong> {matchedDelivery.payloadJson.note}</div>
                    )}
                    <div className="font-sans text-[9px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/50 mt-1">
                      Garansi Aktif Hingga: {formatDate(matchedDelivery.warrantyUntil)}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons (Confirm / Cancel / Refund) */}
              <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 flex flex-wrap gap-2 justify-between items-center">
                {/* Invoice Public Link */}
                <Link
                  href={`/invoice/${selectedOrder.id}`}
                  target="_blank"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 px-4 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <span>Buka Invoice Publik</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>

                {/* Pending action buttons */}
                {selectedOrder.status === "PENDING" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmPayment(selectedOrder.id)}
                      disabled={loading}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-amber-600 hover:bg-amber-500 px-4 text-xs font-bold text-white transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Konfirmasi Bayar</span>
                    </button>
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      disabled={loading}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-500 px-4 text-xs font-bold text-white transition-colors"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Batalkan Pesanan</span>
                    </button>
                  </div>
                )}

                {/* Refund manual */}
                {["PAID", "PROCESSING", "DELIVERED"].includes(selectedOrder.status) && (
                  <button
                    onClick={() => handleRefund(selectedOrder.id)}
                    disabled={loading}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-500 px-4 text-xs font-bold text-white transition-colors"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Refund Manual</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: MANUAL FULFILLMENT FORM */}
      {/* ---------------------------------------------------- */}
      {fulfillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Proses Manual: {fulfillOrder.id}
              </h3>
              <button
                onClick={() => setFulfillOrder(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400">
              Input data akun premium yang telah Anda siapkan. Data ini akan disimpan di deliveries snapshot dan dikirimkan instan ke WhatsApp pelanggan.
            </p>

            <form onSubmit={handleFulfillSubmit} className="space-y-4">
              {/* Product Label Summary */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/30 rounded-xl border border-zinc-100 dark:border-zinc-800/80 text-xs">
                <span className="text-zinc-400 block font-bold uppercase text-[9px] tracking-wider">Produk Yang Dipesan</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {fulfillOrder.productNameSnap} ({fulfillOrder.variantNameSnap})
                </span>
              </div>

              {/* Email / Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Email / Username Akun</label>
                <input
                  type="text"
                  placeholder="netflix-user@gmail.com"
                  value={emailField}
                  onChange={(e) => setEmailField(e.target.value)}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Password</label>
                <input
                  type="text"
                  placeholder="Masukkan password akun"
                  value={passwordField}
                  onChange={(e) => setPasswordField(e.target.value)}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Profile & PIN in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Profil</label>
                  <input
                    type="text"
                    value={profileField}
                    onChange={(e) => setProfileField(e.target.value)}
                    required
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">PIN Profil</label>
                  <input
                    type="text"
                    value={pinField}
                    onChange={(e) => setPinField(e.target.value)}
                    required
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Catatan tambahan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Catatan Khusus Penerima</label>
                <textarea
                  placeholder="Contoh: Tolong patuhi profil yang dipilih. Jangan edit password!"
                  value={noteField}
                  onChange={(e) => setNoteField(e.target.value)}
                  rows={2}
                  className="w-full text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <CircleAlert className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setFulfillOrder(null)}
                  className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-850"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-955 inline-flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{loading ? "Memproses..." : "Tandai Selesai"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Confirm Modal & Toast */}
      {confirmModal && (
        <CustomConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      <CustomToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
