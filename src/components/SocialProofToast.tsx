"use client";

import { useEffect, useState, useRef } from "react";
import { X, ShoppingBag } from "lucide-react";

interface SocialProofOrder {
  id: string;
  maskedWa: string;
  productNameSnap: string;
  variantNameSnap: string;
  deliveredAt: string;
}

export default function SocialProofToast() {
  const [orders, setOrders] = useState<SocialProofOrder[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const rotateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Fetch social proof data
  useEffect(() => {
    if (closed) return;

    const fetchSocialProof = async () => {
      try {
        const res = await fetch("/api/social-proof");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setOrders(data);
            setVisible(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch social proof in toast:", err);
      }
    };

    fetchSocialProof();
  }, [closed]);

  // Rotator effect
  useEffect(() => {
    if (orders.length <= 1 || closed) return;

    const duration = 8000; // 8 seconds rotation

    rotateIntervalRef.current = setInterval(() => {
      // Fade out
      setVisible(false);

      // Wait for fade transition, then change data and fade in
      const fadeTimeout = setTimeout(
        () => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % orders.length);
          setVisible(true);
        },
        reducedMotion ? 0 : 300
      );

      return () => clearTimeout(fadeTimeout);
    }, duration);

    return () => {
      if (rotateIntervalRef.current) {
        clearInterval(rotateIntervalRef.current);
      }
    };
  }, [orders, closed, reducedMotion]);

  // Handle manual close
  const handleClose = () => {
    setClosed(true);
    setVisible(false);
    if (rotateIntervalRef.current) {
      clearInterval(rotateIntervalRef.current);
    }
  };

  // Helper to format relative time in Indonesian
  const formatTimeAgo = (dateStr: string) => {
    try {
      const past = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} menit lalu`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} hari lalu`;
    } catch (err) {
      return "Beberapa saat lalu";
    }
  };

  if (closed || orders.length === 0) return null;

  const currentOrder = orders[currentIndex];
  if (!currentOrder) return null;

  // Animation classes
  const transitionClass = reducedMotion
    ? "transition-none"
    : "transition-all duration-300 ease-out";

  const opacityClass = visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-[-20px]";

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:right-auto z-40 max-w-sm sm:w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-3.5 shadow-lg backdrop-blur-sm ${transitionClass} ${opacityClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Shopping bag Icon badge */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          <ShoppingBag className="h-5 w-5" />
        </div>

        {/* Toast Body */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {currentOrder.maskedWa}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">•</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              {formatTimeAgo(currentOrder.deliveredAt)}
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
            Membeli{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {currentOrder.productNameSnap}
            </span>{" "}
            {currentOrder.variantNameSnap}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
