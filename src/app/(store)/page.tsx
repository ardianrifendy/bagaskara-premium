import { db } from "@/db";
import { categories, products, variants, stockItems } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import LandingClient from "@/components/LandingClient";

// Force dynamic or dynamic-revalidate. In Next.js, we want fresh catalog details.
export const dynamic = "force-dynamic";

export default async function Page() {
  // Query all active categories ordered by sortOrder
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder);

  // Query all active products
  const activeProducts = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      name: products.name,
      slug: products.slug,
      tagline: products.tagline,
      badge: products.badge,
      iconUrl: products.iconUrl,
      isActive: products.isActive,
      sortOrder: products.sortOrder,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.sortOrder);

  // Calculate stock status for each product
  const productsWithStockStatus = await Promise.all(
    activeProducts.map(async (p) => {
      const activeVariants = await db
        .select({
          id: variants.id,
          deliveryMode: variants.deliveryMode,
        })
        .from(variants)
        .where(and(eq(variants.productId, p.id), eq(variants.isActive, true)));

      if (activeVariants.length === 0) {
        return { ...p, isOutOfStock: true };
      }

      let hasStock = false;
      for (const v of activeVariants) {
        if (v.deliveryMode !== "AUTO_STOCK") {
          hasStock = true;
          break;
        } else {
          const countRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(stockItems)
            .where(and(eq(stockItems.variantId, v.id), eq(stockItems.status, "AVAILABLE")));
          if ((countRes[0]?.count || 0) > 0) {
            hasStock = true;
            break;
          }
        }
      }

      return { ...p, isOutOfStock: !hasStock };
    })
  );

  return (
    <div className="min-h-screen">
      <LandingClient categories={allCategories} products={productsWithStockStatus} />
    </div>
  );
}
