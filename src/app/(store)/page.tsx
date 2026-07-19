import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  return (
    <div className="min-h-screen">
      <LandingClient categories={allCategories} products={activeProducts} />
    </div>
  );
}
