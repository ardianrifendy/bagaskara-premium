"use client";

import React, { useState } from "react";
import { saveSettings } from "@/app/actions/settings";
import { Settings, Save, CheckCircle2, CircleAlert, Phone, HelpCircle } from "lucide-react";

interface AdminSettingsManagerProps {
  defaultSettings: {
    csWhatsapp: string;
    warrantyText: string;
    socialProofEnabled: boolean;
  };
}

export default function AdminSettingsManager({ defaultSettings }: AdminSettingsManagerProps) {
  const [csWhatsapp, setCsWhatsapp] = useState(defaultSettings.csWhatsapp);
  const [warrantyText, setWarrantyText] = useState(defaultSettings.warrantyText);
  const [socialProofEnabled, setSocialProofEnabled] = useState(defaultSettings.socialProofEnabled);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      });

      if (res.success) {
        setSuccess("Pengaturan toko berhasil diperbarui.");
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
    <div className="max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          Konfigurasi Toko Digital
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
              rows={4}
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

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <CircleAlert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Save button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-955 dark:hover:bg-emerald-400 transition-colors duration-200 disabled:opacity-50 select-none min-h-[44px]"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
