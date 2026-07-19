"use server";

import { db } from "@/db";
import { orders, deliveries, variants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { sendWhatsAppMessage, waTemplates } from "@/lib/wa";

const manualFulfillSchema = z.object({
  orderId: z.string().min(1),
  email: z.string().min(1, "Email / Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  profile: z.string().default("-"),
  pin: z.string().default("-"),
  note: z.string().default(""),
});

export async function fulfillOrderManual(input: z.infer<typeof manualFulfillSchema>) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.username) {
    return { success: false, error: "Unauthorized access" };
  }

  const validation = manualFulfillSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Validasi gagal" };
  }

  const { orderId, email, password, profile, pin, note } = validation.data;
  const adminName = session.username;

  try {
    // 1. Fetch order details
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderResult.length === 0) {
      return { success: false, error: "Pesanan tidak ditemukan." };
    }

    const order = orderResult[0];

    if (order.status !== "PROCESSING") {
      return { success: false, error: "Hanya pesanan berstatus PROCESSING yang dapat diproses manual." };
    }

    // 2. Fetch associated variant for warranty duration
    const variantResult = await db
      .select()
      .from(variants)
      .where(eq(variants.id, order.variantId))
      .limit(1);

    if (variantResult.length === 0) {
      return { success: false, error: "Varian produk tidak ditemukan." };
    }

    const variant = variantResult[0];

    // 3. Create snapshot and insert into deliveries
    const warrantyUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * variant.warrantyDays);
    await db.insert(deliveries).values({
      orderId,
      payloadJson: {
        email: email.trim(),
        password: password.trim(),
        profile: profile.trim() || "-",
        pin: pin.trim() || "-",
        note: note.trim() || "",
      },
      warrantyUntil,
    });

    // 4. Update order to DELIVERED
    await db
      .update(orders)
      .set({
        status: "DELIVERED",
        deliveredAt: new Date(),
        statusChangedBy: `admin:${adminName}`,
        statusChangedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // 5. Fire-and-forget WA Notification to customer
    const accountData = {
      email,
      pass: password,
      profile: profile || "-",
      pin: pin || "-",
      note,
    };

    const msg = waTemplates.accountDelivered(
      orderId,
      order.productNameSnap,
      order.variantNameSnap,
      accountData,
      variant.warrantyDays
    );
    sendWhatsAppMessage(order.waNumber, msg);

    revalidatePath("/admin/order");
    revalidatePath("/admin");
    revalidatePath(`/invoice/${orderId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Manual Fulfill Error:", error);
    return { success: false, error: error?.message || "Gagal memproses pesanan secara manual." };
  }
}

export async function refundOrderManual(orderId: string) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.username) {
    return { success: false, error: "Unauthorized access" };
  }

  const adminName = session.username;

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

    // Allow refund only for paid, processing, or delivered orders
    const refundableStatuses = ["PAID", "PROCESSING", "DELIVERED"];
    if (!refundableStatuses.includes(order.status)) {
      return { success: false, error: "Pesanan tidak dalam status yang dapat di-refund." };
    }

    await db
      .update(orders)
      .set({
        status: "REFUNDED",
        statusChangedBy: `admin:${adminName}`,
        statusChangedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/admin/order");
    revalidatePath("/admin");
    revalidatePath(`/invoice/${orderId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Refund Order Error:", error);
    return { success: false, error: error?.message || "Gagal merubah status pesanan ke REFUNDED." };
  }
}
