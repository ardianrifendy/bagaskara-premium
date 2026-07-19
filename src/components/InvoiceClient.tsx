"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder } from "@/app/actions/order";
import { formatRupiah, formatDateTime, formatDate } from "@/lib/format";
import {
  Clock,
  Copy,
  Check,
  CircleCheck,
  CircleAlert,
  CircleX,
  MessageCircle,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface InvoiceClientProps {
  order: {
    id: string;
    productNameSnap: string;
    variantNameSnap: string;
    price: number;
    waNumber: string;
    email: string;
    note: string | null;
    status: "PENDING" | "PAID" | "PROCESSING" | "DELIVERED" | "EXPIRED" | "FAILED" | "REFUNDED";
    paymentQrUrl: string;
    expiredAt: string; // ISO string
    createdAt: string; // ISO string
  };
  delivery: {
    payloadJson: any; // { email, password/pass, profile, pin, note }
    warrantyUntil: string;
  } | null;
  warrantyDays: number;
}

export default function InvoiceClient({ order, delivery, warrantyDays }: InvoiceClientProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Polling for PENDING or PROCESSING status updates
  useEffect(() => {
    const isPendingOrProcessing = order.status === "PENDING" || order.status === "PROCESSING" || order.status === "PAID";
    if (!isPendingOrProcessing) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== order.status) {
            router.refresh(); // Refresh route props when status updates server-side
          }
        }
      } catch (err) {
        console.error("Polling status failed:", err);
      }
    };

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(pollStatus, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [order.id, order.status, router]);

  // 2. Countdown timer for PENDING payments
  useEffect(() => {
    if (order.status !== "PENDING") return;

    const calculateTimeLeft = () => {
      const expiration = new Date(order.expiredAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiration - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        router.refresh(); // Refresh to trigger EXPIRED state on server
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [order.status, order.expiredAt, router]);

  // 3. Format seconds into MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 4. Handle copy to clipboard
  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000); // Reset after 2s
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // 5. Handle manual order cancellation
  const handleCancel = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;

    setError(null);
    setCancelLoading(true);

    try {
      const res = await cancelOrder(order.id);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Gagal membatalkan pesanan.");
        setCancelLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan sistem.");
      setCancelLoading(false);
    }
  };

  // WhatsApp claim warranty template link
  const waCSNumber = "628123456789"; // Will be fetched from Settings in Phase 2
  const claimMessage = `Halo Admin Bagaskara Premium, saya ingin klaim garansi untuk order dengan Invoice ID *${order.id}*.\n\n` +
    `*Produk:* ${order.productNameSnap} - ${order.variantNameSnap}\n` +
    `*Kendala:* [Tulis kendala Anda di sini]`;
  const claimWarrantyUrl = `https://api.whatsapp.com/send?phone=${waCSNumber}&text=${encodeURIComponent(claimMessage)}`;

  // Credentials payload formatting
  const renderCredentials = () => {
    if (!delivery) return null;

    const payload = delivery.payloadJson as Record<string, any>;
    const fields = [
      { key: "email", label: "Email / Username", val: payload.email },
      { key: "pass", label: "Password", val: payload.password || payload.pass || "" },
      { key: "profile", label: "Profil Akun", val: payload.profile },
      { key: "pin", label: "PIN Profil", val: payload.pin },
      { key: "note", label: "Catatan Tambahan", val: payload.note },
    ].filter((f) => f.val && f.val !== "-");

    return (
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                {field.label}
              </span>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 break-all select-all font-mono">
                {field.val}
              </span>
            </div>
            <button
              onClick={() => handleCopy(field.val, field.key)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 px-4 text-xs font-semibold text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-500 hover:bg-white dark:hover:bg-zinc-900 transition-colors sm:self-center self-start"
            >
              {copiedField === field.key ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-500">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 4 STATE HEADERS */}

      {/* STATE 1: PENDING */}
      {order.status === "PENDING" && (
        <div className="space-y-6">
          {/* Banner Status */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center space-y-2">
            <div className="inline-flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Clock className="h-4.5 w-4.5 animate-pulse" />
              <span>Menunggu Pembayaran</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Silakan selesaikan pembayaran Anda sebelum waktu pembayaran kadaluwarsa.
            </p>
          </div>

          {/* QR Code & Total Card */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center space-y-6 shadow-sm transition-colors">
            <div>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Total Tagihan
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                  {formatRupiah(order.price)}
                </span>
                <button
                  onClick={() => handleCopy(order.price.toString(), "amount")}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  aria-label="Salin total nominal tagihan"
                >
                  {copiedField === "amount" ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Countdown timer */}
            <div className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 px-4 py-1.5 text-sm font-extrabold text-rose-600 dark:text-rose-400 select-none">
              <Clock className="h-4 w-4" />
              <span>Sisa Waktu Bayar: {formatTimer(timeLeft)}</span>
            </div>

            {/* QRIS Code Image */}
            <div className="flex flex-col items-center justify-center p-4 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white max-w-[260px] mx-auto shadow-inner select-none">
              <div className="relative w-48 h-48 sm:w-52 sm:h-52">
                <Image
                  src={order.paymentQrUrl}
                  alt="QRIS Dinamis QR Code"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase mt-2">
                QRIS DITAMPILKAN OTOMATIS
              </span>
            </div>

            {/* Instructions */}
            <div className="text-left space-y-3.5 border-t border-zinc-100 dark:border-zinc-800 pt-5">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                Langkah Pembayaran:
              </h3>
              <ol className="list-decimal pl-4 text-xs text-zinc-500 dark:text-zinc-400 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Simpan/Scan QRIS:</strong> Pindai kode QRIS di atas menggunakan e-wallet (Gopay, OVO, Dana, LinkAja) atau Mobile Banking Anda.
                </li>
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Verifikasi Nominal:</strong> Pastikan nominal transfer yang tertera sama persis dengan total tagihan di atas.
                </li>
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Selesai:</strong> Pembayaran Anda akan otomatis terdeteksi dalam 5-30 detik. Jangan tutup halaman ini sampai status berganti.
                </li>
              </ol>
            </div>

            {/* Error display */}
            {error && (
              <div className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 p-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-500 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-full px-4 py-2 min-h-[44px]"
              >
                {cancelLoading ? "Membatalkan..." : "Batalkan Pesanan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: PAID or PROCESSING */}
      {(order.status === "PAID" || order.status === "PROCESSING") && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-6 text-center space-y-4 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Pembayaran Diterima!
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Pesanan sedang diproses sistem & admin (maksimal 30 menit).
              </p>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Akun premium sedang disiapkan. Halaman ini akan otomatis berganti ke halaman invoice selesai begitu akun Anda dikirimkan. Mohon jangan ditutup.
            </p>
          </div>
        </div>
      )}

      {/* STATE 3: DELIVERED */}
      {order.status === "DELIVERED" && (
        <div className="space-y-6">
          {/* Banner Status */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-center space-y-1.5 shadow-sm">
            <div className="inline-flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <CircleCheck className="h-5 w-5" />
              <span>Pesanan Selesai / Terkirim</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Detail data login akun premium Anda telah tersedia di bawah ini.
            </p>
          </div>

          {/* Credentials Card */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
              Detail Akun Premium
            </h3>

            {/* Renders email, password, profile, pin, notes */}
            {renderCredentials()}

            {/* Note alert */}
            <div className="flex gap-2 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/25 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed select-none">
              <Info className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Panduan Akun:</p>
                <p>Salin email & password di atas untuk login ke aplikasi resmi. Mohon patuhi profil dan PIN (jika ada) untuk keamanan akun Anda.</p>
              </div>
            </div>
          </div>

          {/* Warranty Card */}
          {delivery && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm transition-colors">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
                Informasi Garansi Resmi
              </h3>
              <div className="space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-800/40 pb-2">
                  <span>Masa Garansi Varian</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{warrantyDays} Hari</span>
                </div>
                <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-800/40 pb-2">
                  <span>Garansi Berlaku Hingga</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {formatDate(delivery.warrantyUntil)}
                  </span>
                </div>
                <div className="leading-relaxed bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[11px]">
                  Garansi mencakup: akun tidak premium, salah password, profile bermasalah. Garansi hangus jika pembeli mengubah password/detail akun.
                </div>
              </div>

              {/* Warranty claim Button */}
              <a
                href={claimWarrantyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              >
                <MessageCircle className="h-4.5 w-4.5" />
                <span>Klaim Garansi WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* STATE 4: EXPIRED / FAILED / REFUNDED */}
      {(order.status === "EXPIRED" || order.status === "FAILED" || order.status === "REFUNDED") && (
        <div className="space-y-6">
          {/* Banner Status */}
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-6 text-center space-y-4 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <CircleX className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {order.status === "REFUNDED" ? "Pesanan Di-refund" : "Pesanan Gagal / Kadaluwarsa"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-sm mx-auto">
                {order.status === "REFUNDED"
                  ? "Pembayaran telah dikembalikan oleh admin. Hubungi CS untuk info lanjut."
                  : "Batas waktu pembayaran habis atau transaksi dibatalkan oleh Anda."}
              </p>
            </div>
            {/* Create new order button */}
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 min-h-[44px]"
              >
                <span>Buat Pesanan Baru</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE METADATA DETAILS (Rendered for all states at the bottom) */}
      <div className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm transition-colors text-xs text-zinc-600 dark:text-zinc-400">
        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
          Ringkasan Transaksi
        </h3>
        <div className="space-y-2.5">
          <div className="flex justify-between">
            <span>ID Invoice</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-200 select-all font-mono">
              {order.id}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Produk</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-300">
              {order.productNameSnap}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Varian</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-300">
              {order.variantNameSnap}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Nomor WA</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-300">
              {order.waNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Email Pembeli</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-300 break-all select-all">
              {order.email}
            </span>
          </div>
          {order.note && (
            <div className="flex flex-col gap-1 border-t border-zinc-50 dark:border-zinc-800/40 pt-2 text-left">
              <span className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider">Catatan Pembeli</span>
              <p className="bg-zinc-50 dark:bg-zinc-950/20 p-2.5 rounded-lg text-zinc-600 dark:text-zinc-400 font-sans italic border border-zinc-100 dark:border-zinc-800/50">
                &quot;{order.note}&quot;
              </p>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2.5 text-zinc-500 dark:text-zinc-500">
            <span>Tanggal Pemesanan</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
