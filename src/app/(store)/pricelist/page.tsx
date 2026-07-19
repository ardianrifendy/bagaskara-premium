import { db } from "@/db";
import { categories, products, variants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { formatRupiah } from "@/lib/format";
import { Tag, Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PricelistPage() {
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder);

  const allProductsWithVariants = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      productName: products.name,
      variantName: variants.name,
      price: variants.price,
      comparePrice: variants.comparePrice,
    })
    .from(products)
    .innerJoin(variants, eq(products.id, variants.productId))
    .where(and(eq(products.isActive, true), eq(variants.isActive, true)))
    .orderBy(products.sortOrder);

  // Group items by category
  const categoriesWithItems = allCategories
    .map((cat) => {
      const items = allProductsWithVariants.filter((item) => item.categoryId === cat.id);
      return {
        ...cat,
        items,
      };
    })
    .filter((cat) => cat.items.length > 0);

  // Construct WhatsApp Share Text
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://digital.bagaskaracell.net";
  let shareText = "*DAFTAR HARGA BAGASKARA PREMIUM*\n\nToko akun premium instan 24 jam:\n\n";

  categoriesWithItems.forEach((cat) => {
    shareText += `*${cat.name.toUpperCase()}*\n`;
    cat.items.forEach((item) => {
      shareText += `• ${item.productName} (${item.variantName}) ➜ ${formatRupiah(item.price)}\n`;
    });
    shareText += "\n";
  });

  shareText += `Order cepat & otomatis di:\n${appUrl}`;
  const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back to Home & Share actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>

        <a
          href={waShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        >
          <Share2 className="h-4 w-4" />
          <span>Bagikan ke WA</span>
        </a>
      </div>

      {/* Header title */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-500">
          <Tag className="h-5 w-5" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Pricelist Layanan Premium
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Daftar lengkap harga produk dan varian premium terupdate. Harga hemat, bergaransi, dan aktif 24 jam.
        </p>
      </div>

      {/* Categories tables */}
      <div className="space-y-8">
        {categoriesWithItems.map((cat) => (
          <div
            key={cat.id}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition-colors duration-200"
          >
            {/* Category header */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
                {cat.name}
              </h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3 font-semibold">Layanan</th>
                    <th className="px-4 py-3 font-semibold">Varian</th>
                    <th className="px-4 py-3 font-semibold text-right">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {cat.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3.5">
                        {item.variantName}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        <div className="flex flex-col items-end">
                          <span>{formatRupiah(item.price)}</span>
                          {item.comparePrice && (
                            <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 line-through font-normal">
                              {formatRupiah(item.comparePrice)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
