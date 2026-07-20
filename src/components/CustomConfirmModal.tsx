"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Info, Trash2, X } from "lucide-react";

interface CustomConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  onConfirm,
  onCancel,
}: CustomConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
    info: <Info className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
  };

  const bgIconMap = {
    danger: "bg-rose-100 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
    warning: "bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
    info: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
  };

  const btnConfirmMap = {
    danger: "bg-rose-600 hover:bg-rose-500 text-white dark:bg-rose-600 dark:hover:bg-rose-500",
    warning: "bg-amber-600 hover:bg-amber-500 text-white dark:bg-amber-600 dark:hover:bg-amber-500",
    info: "bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:text-zinc-950",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5 shadow-2xl scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border ${bgIconMap[variant]} flex-shrink-0`}>
            {iconMap[variant]}
          </div>
          <div className="space-y-1 pr-4">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${btnConfirmMap[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
