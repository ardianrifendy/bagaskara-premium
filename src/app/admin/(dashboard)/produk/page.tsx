import { db } from "@/db";
import { categories, products, variants } from "@/db/schema";
import AdminProductManager from "@/components/AdminProductManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // 1. Fetch categories
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder);

  // 2. Fetch products
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(products.sortOrder);

  // 3. Fetch variants
  const allVariants = await db
    .select()
    .from(variants);

  // Serialize datasets to prevent build/client-warnings
  const serializedCategories = allCategories.map((c) => ({ ...c }));
  const serializedProducts = allProducts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));
  const serializedVariants = allVariants.map((v) => ({ ...v }));

  return (
    <AdminProductManager
      categories={serializedCategories}
      products={serializedProducts as any}
      variants={serializedVariants}
    />
  );
}
