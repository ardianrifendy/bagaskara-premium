"use server";

import { db } from "@/db";
import { categories, products, variants } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";

// 1. Zod schemas
const categorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nama kategori wajib diisi"),
  slug: z.string().min(1, "Slug wajib diisi"),
  accentColor: z.string().min(1, "Warna aksen wajib diisi"),
  sortOrder: z.number().default(0),
});

const productSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number({ required_error: "Kategori wajib dipilih" }),
  name: z.string().min(1, "Nama produk wajib diisi"),
  slug: z.string().min(1, "Slug wajib diisi"),
  tagline: z.string().min(1, "Tagline wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  iconUrl: z.string().nullable().optional(),
  badge: z.enum(["HOT", "AUTO", "SMART"]).nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const variantSchema = z.object({
  id: z.number().optional(),
  productId: z.number({ required_error: "Produk wajib dipilih" }),
  name: z.string().min(1, "Nama varian wajib diisi"),
  durationDays: z.number().min(1, "Durasi hari minimal 1 hari"),
  price: z.number().min(100, "Harga minimal Rp100"),
  comparePrice: z.number().nullable().optional(),
  resellerPrice: z.number().nullable().optional(),
  deliveryMode: z.enum(["AUTO_STOCK", "MANUAL_INVITE", "PROVIDER_API"]),
  supplierProductId: z.string().nullable().optional(),
  warrantyDays: z.number().min(0, "Masa garansi minimal 0 hari"),
  isActive: z.boolean().default(true),
});

// 2. Server Actions for Categories
export async function upsertCategory(input: z.infer<typeof categorySchema>) {
  try {
    await requireAdminSession();
    const validation = categorySchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message };
    }

    const { id, name, slug, accentColor, sortOrder } = validation.data;

    if (id) {
      // Update
      await db
        .update(categories)
        .set({ name, slug: slug.toLowerCase(), accentColor, sortOrder })
        .where(eq(categories.id, id));
    } else {
      // Insert
      await db
        .insert(categories)
        .values({ name, slug: slug.toLowerCase(), accentColor, sortOrder });
    }

    revalidatePath("/admin/produk");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Upsert Category Error:", error);
    return { success: false, error: error?.message || "Gagal menyimpan kategori." };
  }
}

export async function deleteCategory(id: number) {
  try {
    await requireAdminSession();
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath("/admin/produk");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Category Error:", error);
    return { success: false, error: error?.message || "Gagal menghapus kategori." };
  }
}

// 3. Server Actions for Products
export async function upsertProduct(input: z.infer<typeof productSchema>) {
  try {
    await requireAdminSession();
    const validation = productSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message };
    }

    const data = validation.data;

    if (data.id) {
      // Update
      await db
        .update(products)
        .set({
          categoryId: data.categoryId,
          name: data.name,
          slug: data.slug.toLowerCase(),
          tagline: data.tagline,
          description: data.description,
          iconUrl: data.iconUrl || null,
          badge: data.badge || null,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        })
        .where(eq(products.id, data.id));
    } else {
      // Insert
      await db.insert(products).values({
        categoryId: data.categoryId,
        name: data.name,
        slug: data.slug.toLowerCase(),
        tagline: data.tagline,
        description: data.description,
        iconUrl: data.iconUrl || null,
        badge: data.badge || null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      });
    }

    revalidatePath("/admin/produk");
    revalidatePath("/");
    revalidatePath(`/produk/${data.slug}`);
    return { success: true };
  } catch (error: any) {
    console.error("Upsert Product Error:", error);
    return { success: false, error: error?.message || "Gagal menyimpan produk." };
  }
}

export async function deleteProduct(id: number) {
  try {
    await requireAdminSession();
    await db.delete(products).where(eq(products.id, id));
    revalidatePath("/admin/produk");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return { success: false, error: error?.message || "Gagal menghapus produk." };
  }
}

export async function bulkUpdateProductStatus(ids: number[], isActive: boolean) {
  if (!ids || ids.length === 0) return { success: false, error: "Tidak ada produk yang dipilih." };
  try {
    await requireAdminSession();
    await db.update(products).set({ isActive }).where(inArray(products.id, ids));
    revalidatePath("/admin/produk");
    revalidatePath("/");
    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("Bulk Update Product Status Error:", error);
    return { success: false, error: error?.message || "Gagal mengubah status produk." };
  }
}

export async function bulkDeleteProducts(ids: number[]) {
  if (!ids || ids.length === 0) return { success: false, error: "Tidak ada produk yang dipilih." };
  try {
    await requireAdminSession();
    await db.delete(products).where(inArray(products.id, ids));
    revalidatePath("/admin/produk");
    revalidatePath("/");
    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("Bulk Delete Products Error:", error);
    return { success: false, error: error?.message || "Gagal menghapus produk." };
  }
}

// 4. Server Actions for Variants
export async function upsertVariant(input: z.infer<typeof variantSchema>) {
  const validation = variantSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message };
  }

  const data = validation.data;

  try {
    if (data.id) {
      // Update
      await db
        .update(variants)
        .set({
          productId: data.productId,
          name: data.name,
          durationDays: data.durationDays,
          price: data.price,
          comparePrice: data.comparePrice || null,
          resellerPrice: data.resellerPrice || null,
          deliveryMode: data.deliveryMode,
          supplierProductId: data.supplierProductId || null,
          warrantyDays: data.warrantyDays,
          isActive: data.isActive,
        })
        .where(eq(variants.id, data.id));
    } else {
      // Insert
      await db.insert(variants).values({
        productId: data.productId,
        name: data.name,
        durationDays: data.durationDays,
        price: data.price,
        comparePrice: data.comparePrice || null,
        resellerPrice: data.resellerPrice || null,
        deliveryMode: data.deliveryMode,
        supplierProductId: data.supplierProductId || null,
        warrantyDays: data.warrantyDays,
        isActive: data.isActive,
      });
    }

    revalidatePath("/admin/produk");
    revalidatePath("/pricelist");
    return { success: true };
  } catch (error: any) {
    console.error("Upsert Variant Error:", error);
    return { success: false, error: error?.message || "Gagal menyimpan varian." };
  }
}

export async function deleteVariant(id: number) {
  try {
    await db.delete(variants).where(eq(variants.id, id));
    revalidatePath("/admin/produk");
    revalidatePath("/pricelist");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Variant Error:", error);
    return { success: false, error: error?.message || "Gagal menghapus varian." };
  }
}
