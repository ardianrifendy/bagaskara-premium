"use client";

import React from "react";
import { Check } from "lucide-react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
  className?: string;
}

export default function CustomCheckbox({
  checked,
  onChange,
  title,
  className = "",
}: CustomCheckboxProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      title={title}
      aria-label={title || "Checkbox"}
      className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none ${
        checked
          ? "bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500 dark:text-zinc-950 shadow-sm scale-105"
          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-transparent hover:border-emerald-500 dark:hover:border-emerald-500"
      } ${className}`}
    >
      <Check className={`h-3.5 w-3.5 stroke-[3] transition-transform ${checked ? "scale-100" : "scale-0"}`} />
    </button>
  );
}
