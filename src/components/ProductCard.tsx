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
  // Map category accent color to Tailwind text and hover classes
  const accentClasses: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    blue: "text-blue-600 dark:text-blue-400",
  };

  const hoverClasses: Record<string, string> = {
    emerald: "hover:border-emerald-500/50 hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10",
    amber: "hover:border-amber-500/50 hover:shadow-amber-500/5 dark:hover:shadow-amber-500/10",
    rose: "hover:border-rose-500/50 hover:shadow-rose-500/5 dark:hover:shadow-rose-500/10",
    blue: "hover:border-blue-500/50 hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10",
  };

  const textAccent = accentClasses[categoryAccent] || "text-zinc-500 dark:text-zinc-400";
  const hoverAccent = hoverClasses[categoryAccent] || "hover:border-zinc-300 dark:hover:border-zinc-700";

  return (
    <Link
      href={`/produk/${product.slug}`}
      className={`group relative flex flex-col items-center justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${hoverAccent}`}
    >
      {/* Top Left Badge */}
      {product.badge && (
        <div className="absolute left-3.5 top-3.5 z-10">
          <Badge type={product.badge} />
        </div>
      )}

      {/* Product Icon with subtle bottom border/shadow */}
      <div className="my-5 flex items-center justify-center relative">
        <ProductIcon
          name={product.name}
          iconUrl={product.iconUrl}
          size={84}
          className="group-hover:scale-105 transition-transform duration-300 shadow-sm"
        />
      </div>

      {/* Product Meta */}
      <div className="w-full flex-grow flex flex-col justify-between space-y-3">
        <div>
          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${textAccent}`}>
            {categoryName}
          </span>
          <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mt-1">
            {product.name}
          </h3>
        </div>

        {/* Tagline wrapped in elegant pill */}
        <div className="inline-flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 dark:bg-zinc-800/40 dark:border-zinc-800/20 px-3 py-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 w-full line-clamp-1">
          {product.tagline}
        </div>
      </div>
    </Link>
  );
}
