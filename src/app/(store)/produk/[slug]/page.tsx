import { db } from "@/db";
import { products, variants, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

  // 1. Fetch product
  const productResult = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
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

  if (categoryResult.length === 0) {
    notFound();
  }

  const category = categoryResult[0];

  // 3. Fetch variants
  const activeVariants = await db
    .select()
    .from(variants)
    .where(and(eq(variants.productId, product.id), eq(variants.isActive, true)))
    .orderBy(variants.price);

  if (activeVariants.length === 0) {
    // If a product has no active variants, treat it as not found / temporarily unavailable
    notFound();
  }

  return (
    <ProductOrderClient
      product={product}
      variants={activeVariants}
      category={category}
    />
  );
}
