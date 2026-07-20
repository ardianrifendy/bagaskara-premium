"use server";

import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { formatRupiah } from "@/lib/format";

// ----------------------------------------------------
// Validation Schema for Public Input
// ----------------------------------------------------
const validatePromoSchema = z.object({
  code: z.string().min(1, "Kode promo tidak boleh kosong").toUpperCase().trim(),
  variantPrice: z.number().min(1, "Harga varian tidak valid"),
});

export async function validatePromoCode(input: { code: string; variantPrice: number }) {
  const parseResult = validatePromoSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input tidak valid.",
    };
  }

  const { code, variantPrice } = parseResult.data;

  try {
    const promoResult = await db
      .select()
      .from(promoCodes)
      .where(and(eq(promoCodes.code, code), eq(promoCodes.isActive, true)))
      .limit(1);

    if (promoResult.length === 0) {
      return {
        success: false,
        error: "Kode promo tidak ditemukan atau sudah tidak aktif.",
      };
    }

    const promo = promoResult[0];

    // Check expiration date
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return {
        success: false,
        error: "Kode promo ini sudah kadaluarsa.",
      };
    }

    // Check usage limit
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return {
        success: false,
        error: "Batas penggunaan kode promo ini sudah habis.",
      };
    }

    // Check minimum purchase amount
    if (variantPrice < promo.minPurchase) {
      return {
        success: false,
        error: `Minimal pembelian untuk kode promo ini adalah ${formatRupiah(promo.minPurchase)}.`,
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (promo.discountType === "PERCENTAGE") {
      const rawDiscount = Math.round((variantPrice * promo.discountValue) / 100);
      if (promo.maxDiscount && promo.maxDiscount > 0) {
        discountAmount = Math.min(rawDiscount, promo.maxDiscount);
      } else {
        discountAmount = rawDiscount;
      }
    } else {
      // FLAT Rp discount
      discountAmount = Math.min(promo.discountValue, variantPrice);
    }

    // Ensure discount does not exceed item price
    discountAmount = Math.min(discountAmount, variantPrice);
    const finalPrice = Math.max(0, variantPrice - discountAmount);

    return {
      success: true,
      promoId: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      finalPrice,
      message: `Kode promo "${promo.code}" berhasil diterapkan! Hemat ${formatRupiah(discountAmount)}.`,
    };
  } catch (err: any) {
    console.error("Error validating promo code:", err);
    return {
      success: false,
      error: "Gagal memproses kode promo. Coba lagi nanti.",
    };
  }
}

// ----------------------------------------------------
// Admin CRUD Server Actions
// ----------------------------------------------------
const promoCodeFormSchema = z.object({
  code: z
    .string()
    .min(2, "Kode minimal 2 karakter")
    .toUpperCase()
    .trim()
    .regex(/^[A-Z0-9_-]+$/, "Kode promo hanya boleh huruf kapital, angka, dan underscore/strip"),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.number().min(1, "Nilai diskon minimal 1"),
  minPurchase: z.number().min(0).default(0),
  maxDiscount: z.number().nullable().optional(),
  usageLimit: z.number().nullable().optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().nullable().optional(), // ISO date string or YYYY-MM-DD
});

export async function getPromoCodes() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    throw new Error("Unauthorized access.");
  }

  return await db
    .select()
    .from(promoCodes)
    .orderBy(desc(promoCodes.createdAt));
}

export async function createPromoCode(input: z.infer<typeof promoCodeFormSchema>) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { success: false, error: "Sesi admin telah berakhir." };
  }

  const parseResult = promoCodeFormSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input tidak valid.",
    };
  }

  const data = parseResult.data;

  try {
    // Check code uniqueness
    const existing = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, data.code))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: `Kode promo "${data.code}" sudah ada.` };
    }

    await db.insert(promoCodes).values({
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minPurchase: data.minPurchase || 0,
      maxDiscount: data.maxDiscount || null,
      usageLimit: data.usageLimit || null,
      isActive: data.isActive,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error creating promo code:", err);
    return { success: false, error: err?.message || "Gagal membuat kode promo." };
  }
}

export async function updatePromoCode(id: number, input: z.infer<typeof promoCodeFormSchema>) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { success: false, error: "Sesi admin telah berakhir." };
  }

  const parseResult = promoCodeFormSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input tidak valid.",
    };
  }

  const data = parseResult.data;

  try {
    // Check code uniqueness excluding current id
    const existing = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, data.code))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      return { success: false, error: `Kode promo "${data.code}" sudah digunakan oleh promo lain.` };
    }

    await db
      .update(promoCodes)
      .set({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minPurchase: data.minPurchase || 0,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        isActive: data.isActive,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .where(eq(promoCodes.id, id));

    return { success: true };
  } catch (err: any) {
    console.error("Error updating promo code:", err);
    return { success: false, error: err?.message || "Gagal memperbarui kode promo." };
  }
}

export async function deletePromoCode(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { success: false, error: "Sesi admin telah berakhir." };
  }

  try {
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting promo code:", err);
    return { success: false, error: err?.message || "Gagal menghapus kode promo." };
  }
}
