import { db } from "@/db";
import { orders, stockItems, variants, products } from "@/db/schema";
import { eq, and, gte, inArray, sql } from "drizzle-orm";
import { formatRupiah } from "@/lib/format";
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  ShoppingBag,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();

  // Start of today (00:00:00)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 7 days ago (00:00:00)
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  // Revenue queries
  const activeStatuses: ("PENDING" | "PAID" | "PROCESSING" | "DELIVERED" | "EXPIRED" | "FAILED" | "REFUNDED")[] = [
    "PAID",
    "PROCESSING",
    "DELIVERED",
  ];

  const todayRevenueResult = await db
    .select({
      total: sql<number>`SUM(${orders.price})::int`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, today), inArray(orders.status, activeStatuses)))
    .limit(1);

  const weeklyRevenueResult = await db
    .select({
      total: sql<number>`SUM(${orders.price})::int`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, sevenDaysAgo), inArray(orders.status, activeStatuses)))
    .limit(1);

  const todayRevenue = todayRevenueResult[0]?.total || 0;
  const weeklyRevenue = weeklyRevenueResult[0]?.total || 0;

  // Order count queries
  const allOrderCounts = await db
    .select({
      status: orders.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .groupBy(orders.status);

  const getStatusCount = (
    status: "PENDING" | "PAID" | "PROCESSING" | "DELIVERED" | "EXPIRED" | "FAILED" | "REFUNDED"
  ) => {
    return allOrderCounts.find((o) => o.status === status)?.count || 0;
  };

  const pendingCount = getStatusCount("PENDING");
  const processingCount = getStatusCount("PROCESSING");
  const deliveredCount = getStatusCount("DELIVERED");

  // Stock warning queries (Active variants with < 3 AVAILABLE stock items)
  const variantStockCounts = await db
    .select({
      variantId: variants.id,
      variantName: variants.name,
      productName: products.name,
      deliveryMode: variants.deliveryMode,
      stockCount: sql<number>`COUNT(CASE WHEN ${stockItems.status} = 'AVAILABLE' THEN 1 END)::int`,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(stockItems, eq(variants.id, stockItems.variantId))
    .where(and(eq(variants.isActive, true), eq(products.isActive, true)))
    .groupBy(variants.id, variants.name, products.name, variants.deliveryMode);

  // Filter low stock and only for AUTO_STOCK delivery mode (MANUAL_INVITE doesn't need stock counts)
  const stockWarnings = variantStockCounts.filter(
    (v) => v.deliveryMode === "AUTO_STOCK" && v.stockCount < 3
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Dashboard Ringkasan
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Pantau omzet penjualan, status pemesanan, dan ketersediaan akun premium.
        </p>
      </div>

      {/* Grid: Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Today */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex items-center gap-4 transition-colors">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Omzet Hari Ini
            </span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 font-mono mt-0.5 block">
              {formatRupiah(todayRevenue)}
            </span>
          </div>
        </div>

        {/* Revenue 7 Days */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex items-center gap-4 transition-colors">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Omzet 7 Hari Terakhir
            </span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 font-mono mt-0.5 block">
              {formatRupiah(weeklyRevenue)}
            </span>
          </div>
        </div>

        {/* Processing Orders */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex items-center gap-4 transition-colors">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Order Butuh Proses
            </span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 font-mono mt-0.5 block">
              {processingCount} <span className="text-xs text-zinc-400 font-normal">Antrean</span>
            </span>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex items-center gap-4 transition-colors">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-500">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Total Order Selesai
            </span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 font-mono mt-0.5 block">
              {deliveredCount} <span className="text-xs text-zinc-400 font-normal">Sukses</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Detailed stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Warnings (Left 2 columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm transition-colors">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Peringatan Ketersediaan Stok (&lt;3)
          </h2>
          <p className="text-xs text-zinc-400">
            Segera tambahkan stok akun untuk varian kirim otomatis berikut agar pembeli dapat langsung dilayani.
          </p>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
            {stockWarnings.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500 dark:text-zinc-400 font-semibold select-none bg-zinc-50 dark:bg-zinc-950/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                Semua stok varian otomatis tercukupi. Sangat bagus!
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                {stockWarnings.map((warning) => (
                  <div
                    key={warning.variantId}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                        {warning.productName}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-500 block">
                        {warning.variantName}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`font-bold px-3 py-1 rounded-full text-center min-w-16 ${
                          warning.stockCount === 0
                            ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/50"
                        }`}
                      >
                        {warning.stockCount} Tersedia
                      </span>
                      <Link
                        href={`/admin/stok?variantId=${warning.variantId}`}
                        className="inline-flex h-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Tambah Stok
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order queue Summary (Right 1 column) */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              Antrean & Penjualan
            </h2>
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-800 pb-2">
                <span className="text-zinc-500">Menunggu Bayar (PENDING)</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{pendingCount}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-800 pb-2">
                <span className="text-zinc-500">Perlu Diproses (PROCESSING)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{processingCount}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-800 pb-2">
                <span className="text-zinc-500">Sudah Terkirim (DELIVERED)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{deliveredCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/admin/order"
              className="w-full inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              Kelola Seluruh Pesanan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
