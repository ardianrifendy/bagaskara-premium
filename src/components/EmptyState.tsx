"use client";

import React from "react";
import { Inbox, PackageSearch, Layers, SearchX } from "lucide-react";

interface EmptyStateProps {
  icon?: "inbox" | "product" | "search" | "layers";
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = "inbox",
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  const iconComponents = {
    inbox: <Inbox className="h-10 w-10 text-emerald-500/80" />,
    product: <PackageSearch className="h-10 w-10 text-emerald-500/80" />,
    search: <SearchX className="h-10 w-10 text-amber-500/80" />,
    layers: <Layers className="h-10 w-10 text-emerald-500/80" />,
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 my-2 space-y-3">
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-850/80 shadow-md border border-zinc-200/50 dark:border-zinc-800">
        {iconComponents[icon]}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
