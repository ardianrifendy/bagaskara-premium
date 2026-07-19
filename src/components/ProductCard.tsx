import Link from "next/link";
import ProductIcon from "./ProductIcon";
import Badge from "./Badge";

interface ProductCardProps {
  product: {
    name: string;
    slug: string;
    tagline: string;
    badge: "HOT" | "AUTO" | "SMART" | null;
    iconUrl?: string | null;
  };
  categoryName: string;
  categoryAccent: string;
}

export default function ProductCard({ product, categoryName, categoryAccent }: ProductCardProps) {
  // Map category accent color to Tailwind text class
  const accentClasses: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    blue: "text-blue-600 dark:text-blue-400",
  };

  const textAccent = accentClasses[categoryAccent] || "text-zinc-500 dark:text-zinc-400";

  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group relative flex flex-col items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      {/* Top Left Badge */}
      {product.badge && (
        <div className="absolute left-3 top-3 z-10">
          <Badge type={product.badge} />
        </div>
      )}

      {/* Product Icon */}
      <div className="my-4 flex items-center justify-center">
        <ProductIcon name={product.name} iconUrl={product.iconUrl} size={80} className="group-hover:scale-105 transition-transform duration-300" />
      </div>

      {/* Product Meta */}
      <div className="w-full flex-grow flex flex-col justify-between space-y-2">
        <div>
          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${textAccent}`}>
            {categoryName}
          </span>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Tagline wrapped in gray pill */}
        <div className="inline-flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-[11px] text-zinc-500 dark:text-zinc-400 w-full line-clamp-1">
          {product.tagline}
        </div>
      </div>
    </Link>
  );
}
