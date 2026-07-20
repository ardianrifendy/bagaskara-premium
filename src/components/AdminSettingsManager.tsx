"use client";

import React, { useState, useEffect } from "react";
import { saveSettings } from "@/app/actions/settings";
import { getSupplierBalanceAction } from "@/app/actions/supplier";
import {
  Settings,
  Save,
  CheckCircle2,
  CircleAlert,
  Phone,
  HelpCircle,
  QrCode,
  Key,
  Globe,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface AdminSettingsManagerProps {
  defaultSettings: {
    csWhatsapp: string;
    warrantyText: string;
    socialProofEnabled: boolean;
    staticQris: string;
    supplierApiKey: string;
    supplierBaseUrl: string;
  };
}

export default function AdminSettingsManager({ defaultSettings }: AdminSettingsManagerProps) {
  const [csWhatsapp, setCsWhatsapp] = useState(defaultSettings.csWhatsapp);
  const [warrantyText, setWarrantyText] = useState(defaultSettings.warrantyText);
  const [socialProofEnabled, setSocialProofEnabled] = useState(defaultSettings.socialProofEnabled);
  const [staticQris, setStaticQris] = useState(defaultSettings.staticQris);
  const [supplierApiKey, setSupplierApiKey] = useState(defaultSettings.supplierApiKey);
  const [supplierBaseUrl, setSupplierBaseUrl] = useState(defaultSettings.supplierBaseUrl);

  // Supplier Balance States
  const [supplierBalance, setSupplierBalance] = useState<number | null>(null);
  const [supplierMembership, setSupplierMembership] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load supplier balance on mount
  useEffect(() => {
    if (defaultSettings.supplierApiKey) {
      loadBalance();
    }
  }, []);

  const loadBalance = async () => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const res = await getSupplierBalanceAction();
      if (res.success) {
        setSupplierBalance(res.balance !== undefined ? res.balance : null);
        setSupplierMembership(res.membership !== undefined ? res.membership : null);
      } else {
        setBalanceError(res.error || "Gagal mengambil data saldo.");
      }
    } catch (err: any) {
      setBalanceError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await saveSettings({
        csWhatsapp,
        warrantyText,
        socialProofEnabled,
        staticQris,
        supplierApiKey,
        supplierBaseUrl,
      });

      if (res.success) {
        setSuccess("Pengaturan toko berhasil diperbarui.");
        // Try reloading balance after saving new key
        if (supplierApiKey.trim()) {
          loadBalance();
        } else {
          setSupplierBalance(null);
          setSupplierMembership(null);
        }
      } else {
        setError(res.error || "Gagal memperbarui pengaturan.");
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
        <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Konfigurasi Toko Digital
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: General configuration */}
        <div className="md:col-span-2 space-y-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Pengaturan Umum
          </h2>

          {/* CS Whatsapp */}
          <div className="space-y-1.5">
            <label htmlFor="cs-whatsapp" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Nomor CS WhatsApp (Mulai dengan 62)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
              <input
                id="cs-whatsapp"
                type="text"
                placeholder="Contoh: 628123456789"
                value={csWhatsapp}
                onChange={(e) => setCsWhatsapp(e.target.value)}
                required
                className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[44px]"
              />
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pl-2 leading-relaxed">
              Link tombol bantuan CS WhatsApp di footer dan invoice akan otomatis mengarah ke nomor ini.
            </p>
          </div>

          {/* QRIS Statis */}
          <div className="space-y-1.5">
            <label htmlFor="static-qris" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              String QRIS Statis Merchant (EMVCo)
            </label>
            <div className="relative">
              <QrCode className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400" />
              <textarea
                id="static-qris"
                placeholder="Masukkan string payload QRIS Statis Anda (contoh: 000201010211...)"
                value={staticQris}
                onChange={(e) => setStaticQris(e.target.value)}
                required
                rows={3}
                className="w-full text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pl-2 leading-relaxed">
              String QRIS ini akan dikonversi secara dinamis sesuai nominal pesanan saat pembeli melakukan checkout.
            </p>
          </div>

          {/* Warranty Text */}
          <div className="space-y-1.5">
            <label htmlFor="warranty-text" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Teks Kebijakan Garansi
            </label>
            <div className="relative">
              <HelpCircle className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400" />
              <textarea
                id="warranty-text"
                placeholder="Masukkan syarat & ketentuan klaim garansi..."
                value={warrantyText}
                onChange={(e) => setWarrantyText(e.target.value)}
                required
                rows={3}
                className="w-full text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pl-2 leading-relaxed">
              Teks kebijakan garansi resmi yang akan ditampilkan di halaman invoice sukses pelanggan.
            </p>
          </div>

          {/* Social Proof Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Tampilkan Social Proof Toast
              </label>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal max-w-sm">
                Aktifkan toast melayang berisi data pembelian terakhir pembeli untuk meningkatkan kepercayaan calon pembeli.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={socialProofEnabled}
                onChange={(e) => setSocialProofEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-1 peer-focus:ring-emerald-500 dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Right Column: Reseller API integration */}
        <div className="space-y-5 flex flex-col justify-between">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
              Integrasi Supplier API
            </h2>

            {/* API Key */}
            <div className="space-y-1.5">
              <label htmlFor="supplier-api-key" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                ProdSeller API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                <input
                  id="supplier-api-key"
                  type="password"
                  placeholder="psk_xxxxxxxxxxxxxxxx"
                  value={supplierApiKey}
                  onChange={(e) => setSupplierApiKey(e.target.value)}
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            {/* Base URL */}
            <div className="space-y-1.5">
              <label htmlFor="supplier-base-url" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                API Base URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                <input
                  id="supplier-base-url"
                  type="text"
                  placeholder="http://51.77.244.194/v1"
                  value={supplierBaseUrl}
                  onChange={(e) => setSupplierBaseUrl(e.target.value)}
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent pl-11 pr-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            {/* Supplier Balance Info box */}
            {defaultSettings.supplierApiKey && (
              <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Saldo Supplier</span>
                  </div>
                  <button
                    type="button"
                    onClick={loadBalance}
                    disabled={balanceLoading}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {balanceLoading ? (
                  <div className="h-10 flex items-center justify-center">
                    <div className="animate-pulse text-[11px] text-zinc-400">Loading saldo...</div>
                  </div>
                ) : balanceError ? (
                  <div className="text-[10px] text-rose-500 font-semibold">{balanceError}</div>
                ) : supplierBalance !== null ? (
                  <div className="space-y-1">
                    <div className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      ${supplierBalance.toFixed(2)}
                    </div>
                    {supplierMembership && (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Membership: {supplierMembership}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-400">Hubungkan API untuk melihat saldo.</div>
                )}
              </div>
            )}
          </div>

          {/* Action Messages */}
          <div className="space-y-2">
            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <CircleAlert className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-955 dark:hover:bg-emerald-400 transition-colors duration-200 disabled:opacity-50 select-none min-h-[44px]"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Menyimpan..." : "Simpan Pengaturan"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
