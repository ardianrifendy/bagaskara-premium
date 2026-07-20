"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

interface CustomToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export default function CustomToast({ toast, onClose }: CustomToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500" />,
    info: <Info className="h-5 w-5 text-amber-500" />,
  };

  const borderMap = {
    success: "border-emerald-500/30 bg-white dark:bg-zinc-900 text-emerald-950 dark:text-emerald-200",
    error: "border-rose-500/30 bg-white dark:bg-zinc-900 text-rose-950 dark:text-rose-200",
    info: "border-amber-500/30 bg-white dark:bg-zinc-900 text-amber-950 dark:text-amber-200",
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-semibold max-w-md ${
          borderMap[toast.type]
        }`}
      >
        {iconMap[toast.type]}
        <span className="flex-1">{toast.text}</span>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
