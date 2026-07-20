"use server";

import { db } from "@/db";
import { stockItems } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";

const bulkStockSchema = z.object({
  variantId: z.number({ required_error: "Varian wajib dipilih" }),
  items: z.array(
    z.object({
      email: z.string().min(1, "Email wajib diisi"),
      password: z.string().min(1, "Password wajib diisi"),
      profile: z.string().default("-"),
      pin: z.string().default("-"),
      note: z.string().default(""),
    })
  ),
});

export async function bulkAddStock(input: z.infer<typeof bulkStockSchema>) {
  try {
    await requireAdminSession();
    const validation = bulkStockSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || "Validasi gagal" };
    }

    const { variantId, items } = validation.data;

    const stockValues = items.map((item) => ({
      variantId,
      payloadJson: {
        email: item.email.trim(),
        password: item.password.trim(),
        profile: item.profile.trim() || "-",
        pin: item.pin.trim() || "-",
        note: item.note.trim() || "",
      },
      status: "AVAILABLE" as const,
    }));

    if (stockValues.length > 0) {
      await db.insert(stockItems).values(stockValues);
    }

    revalidatePath("/admin/stok");
    revalidatePath("/admin");
    return { success: true, count: stockValues.length };
  } catch (error: any) {
    console.error("Bulk Add Stock Error:", error);
    return { success: false, error: error?.message || "Gagal menyimpan stok akun." };
  }
}

export async function updateStockStatus(id: number, status: "AVAILABLE" | "SOLD" | "PROBLEM") {
  try {
    await requireAdminSession();
    await db
      .update(stockItems)
      .set({ status })
      .where(eq(stockItems.id, id));

    revalidatePath("/admin/stok");
    return { success: true };
  } catch (error: any) {
    console.error("Update Stock Status Error:", error);
    return { success: false, error: error?.message || "Gagal memperbarui status stok." };
  }
}

export async function deleteStock(id: number) {
  try {
    await requireAdminSession();
    await db.delete(stockItems).where(eq(stockItems.id, id));
    revalidatePath("/admin/stok");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Stock Error:", error);
    return { success: false, error: error?.message || "Gagal menghapus stok." };
  }
}

export async function bulkDeleteStock(ids: number[]) {
  if (!ids || ids.length === 0) return { success: false, error: "Tidak ada stok yang dipilih." };
  try {
    await requireAdminSession();
    await db.delete(stockItems).where(inArray(stockItems.id, ids));
    revalidatePath("/admin/stok");
    revalidatePath("/admin");
    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("Bulk Delete Stock Error:", error);
    return { success: false, error: error?.message || "Gagal menghapus stok terpilih." };
  }
}
