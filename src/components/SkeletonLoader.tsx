"use client";

import React from "react";

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="flex items-center justify-between p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-850/50 gap-4"
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 ${
                cIdx === 0 ? "w-1/3" : "w-1/6"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProductCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-3xl p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 animate-pulse"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-3/4 mx-auto rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-1/2 mx-auto rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}
