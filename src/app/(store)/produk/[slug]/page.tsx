import { db } from "@/db";
import { products, variants, categories, stockItems } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductOrderClient from "@/components/ProductOrderClient";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = params;

  // 1. Fetch product (by slug)
  const productResult = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (productResult.length === 0) {
    notFound();
  }

  const product = productResult[0];

  // 2. Fetch category
  const categoryResult = await db
    .select({
      id: categories.id,
      name: categories.name,
      accentColor: categories.accentColor,
    })
    .from(categories)
    .where(eq(categories.id, product.categoryId))
    .limit(1);

  const category = categoryResult[0] || {
    id: 0,
    name: "Layanan",
    accentColor: "emerald",
  };

  // 3. Fetch active variants for this product
  const activeVariants = await db
    .select()
    .from(variants)
    .where(and(eq(variants.productId, product.id), eq(variants.isActive, true)))
    .orderBy(variants.price);

  // 4. Calculate available stock counts for AUTO_STOCK variants
  const variantsWithStock = await Promise.all(
    activeVariants.map(async (v) => {
      if (v.deliveryMode === "AUTO_STOCK") {
        const stockResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(stockItems)
          .where(and(eq(stockItems.variantId, v.id), eq(stockItems.status, "AVAILABLE")));
        const count = stockResult[0]?.count || 0;
        return { ...v, stockCount: count };
      }
      return { ...v, stockCount: 999 }; // Virtual/unlimited for manual or provider API
    })
  );

  return (
    <ProductOrderClient
      product={product}
      variants={variantsWithStock}
      category={category}
    />
  );
}
