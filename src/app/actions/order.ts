"use server";

import { db } from "@/db";
import { orders, variants, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { createTransaction } from "@/lib/payment/tripay";
import { normalizeWhatsApp } from "@/lib/format";

const orderSchema = z.object({
  variantId: z.number({ required_error: "Varian harus dipilih" }),
  waNumber: z
    .string()
    .min(1, "Nomor WhatsApp wajib diisi")
    .regex(/^(08|628|\+628)\d{8,13}$/, "Nomor WhatsApp tidak valid (contoh: 08123456789 atau 628123456789)"),
  email: z.string().min(1, "Email wajib diisi").email("Email tidak valid"),
  note: z.string().max(200, "Catatan maksimal 200 karakter").optional().nullable(),
});

export type OrderInput = z.infer<typeof orderSchema>;

export async function createOrder(input: OrderInput) {
  // 1. Validate inputs
  const validation = orderSchema.safeParse(input);
  if (!validation.success) {
    const errorMsg = validation.error.errors[0]?.message || "Validasi gagal";
    return { success: false, error: errorMsg };
  }

  const { variantId, waNumber, email, note } = validation.data;
  const cleanWa = normalizeWhatsApp(waNumber);

  try {
    // 2. Fetch variant and its product from DB
    const variantResult = await db
      .select({
        variant: variants,
        product: products,
      })
      .from(variants)
      .innerJoin(products, eq(variants.productId, products.id))
      .where(and(eq(variants.id, variantId), eq(variants.isActive, true), eq(products.isActive, true)))
      .limit(1);

    if (variantResult.length === 0) {
      return { success: false, error: "Varian produk tidak ditemukan atau sudah tidak aktif." };
    }

    const { variant, product } = variantResult[0];

    // 3. Generate uppercase Order ID: BGS-XXXXXXXX
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const generateId = customAlphabet(alphabet, 8);
    const orderId = `BGS-${generateId()}`;

    // 4. Request transaction from Tripay (QRIS method)
    const tripayResult = await createTransaction({
      orderId,
      amount: variant.price, // Trust ONLY price from database, not client
      customerName: `Customer ${cleanWa}`,
      email,
      phone: cleanWa,
      productName: `${product.name} - ${variant.name}`,
    });

    // 5. Save order in PENDING status in DB
    await db.insert(orders).values({
      id: orderId,
      variantId: variant.id,
      productNameSnap: product.name,
      variantNameSnap: variant.name,
      price: variant.price,
      waNumber: cleanWa,
      email: email.toLowerCase().trim(),
      note: note || null,
      status: "PENDING",
      paymentRef: tripayResult.reference,
      paymentQrUrl: tripayResult.qrUrl,
      expiredAt: tripayResult.expiredAt,
    });

    return {
      success: true,
      orderId: orderId,
    };
  } catch (error: any) {
    console.error("Error creating order inside server action:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan sistem saat membuat pesanan.",
    };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderResult.length === 0) {
      return { success: false, error: "Pesanan tidak ditemukan." };
    }

    const order = orderResult[0];
    if (order.status !== "PENDING") {
      return { success: false, error: "Hanya pesanan pending yang dapat dibatalkan." };
    }

    await db
      .update(orders)
      .set({
        status: "FAILED",
        statusChangedBy: "user",
        statusChangedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    return { success: false, error: "Gagal membatalkan pesanan." };
  }
}
