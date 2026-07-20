import { db } from "@/db";
import { stockItems, variants, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import AdminStockManager from "@/components/AdminStockManager";

export const dynamic = "force-dynamic";

interface AdminStockPageProps {
  searchParams: {
    variantId?: string;
  };
}

export default async function AdminStockPage({ searchParams }: AdminStockPageProps) {
  // 1. Fetch variants with product names
  const allVariants = await db
    .select({
      id: variants.id,
      productId: variants.productId,
      name: variants.name,
      productName: products.name,
      supplierProductId: variants.supplierProductId,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .where(eq(products.isActive, true))
    .orderBy(products.sortOrder);

  // 2. Fetch stock items ordered by newest
  const allStockItems = await db
    .select()
    .from(stockItems)
    .orderBy(desc(stockItems.createdAt));

  // Serialize to prevent date/warnings
  const serializedStockItems = allStockItems.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));

  const defaultSelectedVariantId = searchParams.variantId
    ? parseInt(searchParams.variantId)
    : undefined;

  return (
    <div className="min-h-screen">
      <AdminStockManager
        variants={allVariants}
        stockItems={serializedStockItems}
        defaultSelectedVariantId={defaultSelectedVariantId}
      />
    </div>
  );
}
