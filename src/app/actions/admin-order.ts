"use server";

import { db } from "@/db";
import { orders, deliveries, variants, products, settings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { sendWhatsAppMessage, waTemplates } from "@/lib/wa";
import { processSupplierFulfillment } from "@/lib/fulfillment";

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

export async function confirmPaymentManual(orderId: string) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.username) {
    return { success: false, error: "Akses tidak sah." };
  }

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

    // Idempotency check: Only allow PENDING orders to be confirmed
    if (order.status !== "PENDING") {
      return { success: false, error: "Hanya pesanan berstatus PENDING yang dapat dikonfirmasi pembayarannya." };
    }

    // 2. Fetch associated variant and product
    const variantResult = await db
      .select({
        variant: variants,
        product: products,
      })
      .from(variants)
      .innerJoin(products, eq(variants.productId, products.id))
      .where(eq(variants.id, order.variantId))
      .limit(1);

    if (variantResult.length === 0) {
      return { success: false, error: "Varian produk tidak ditemukan." };
    }

    const { variant, product } = variantResult[0];
    let outcome: "DELIVERED" | "STOCK_EMPTY" | "PROCESSING" = "PROCESSING";
    let allocatedStockPayload: any = null;
    let isProviderHandled = false;

    if (variant.deliveryMode === "PROVIDER_API") {
      isProviderHandled = true;

      // Update paid status first
      await db
        .update(orders)
        .set({
          paidAt: new Date(),
          statusChangedBy: `admin:${adminName}`,
          statusChangedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Execute supplier fulfillment
      await processSupplierFulfillment(orderId);
    } else if (variant.deliveryMode === "AUTO_STOCK") {
      // Atomic UPDATE ... RETURNING query with FOR UPDATE SKIP LOCKED
      const updateResult = await db.execute(sql`
        UPDATE stock_items
        SET status = 'SOLD', sold_order_id = ${orderId}
        WHERE id = (
          SELECT id
          FROM stock_items
          WHERE variant_id = ${variant.id} AND status = 'AVAILABLE'
          ORDER BY created_at
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id, payload_json;
      `);

      const rows = updateResult.rows;

      if (rows.length > 0) {
        const stockRow = rows[0] as { id: number; payload_json: any };
        allocatedStockPayload = stockRow.payload_json;

        // Insert snapshot into deliveries
        const warrantyUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * variant.warrantyDays);
        await db.insert(deliveries).values({
          orderId: orderId,
          payloadJson: allocatedStockPayload,
          warrantyUntil: warrantyUntil,
        });

        // Update order status to DELIVERED
        await db
          .update(orders)
          .set({
            status: "DELIVERED",
            paidAt: new Date(),
            deliveredAt: new Date(),
            statusChangedBy: `admin:${adminName}`,
            statusChangedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        outcome = "DELIVERED";
      } else {
        // Stock empty -> set status to PROCESSING
        await db
          .update(orders)
          .set({
            status: "PROCESSING",
            paidAt: new Date(),
            statusChangedBy: `admin:${adminName}`,
            statusChangedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        outcome = "STOCK_EMPTY";
      }
    } else {
      // Delivery mode MANUAL_INVITE -> set status to PROCESSING
      await db
        .update(orders)
        .set({
          status: "PROCESSING",
          paidAt: new Date(),
          statusChangedBy: `admin:${adminName}`,
          statusChangedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      outcome = "PROCESSING";
    }

    // Fire-and-forget WhatsApp notifications
    if (!isProviderHandled) {
      if (outcome === "DELIVERED" && allocatedStockPayload) {
        const payloadData = allocatedStockPayload as Record<string, any>;
        const accountData = {
          email: payloadData.email || "",
          pass: payloadData.password || payloadData.pass || "",
          profile: payloadData.profile || "-",
          pin: payloadData.pin || "-",
          note: payloadData.note || "",
        };

        const msg = waTemplates.accountDelivered(
          order.id,
          order.productNameSnap,
          order.variantNameSnap,
          accountData,
          variant.warrantyDays
        );
        sendWhatsAppMessage(order.waNumber, msg);
      } else if (outcome === "STOCK_EMPTY") {
        // Notify user order is processing
        const userMsg = waTemplates.orderProcessing(order.id, order.productNameSnap, order.variantNameSnap);
        sendWhatsAppMessage(order.waNumber, userMsg);

        // Notify admin about stock alert
        const settingsResult = await db
          .select()
          .from(settings)
          .where(eq(settings.key, "cs_whatsapp"))
          .limit(1);
        const adminPhone = settingsResult[0]?.value || "6289513679939";
        const adminMsg = waTemplates.stockEmptyAlert(order.id, order.productNameSnap, order.variantNameSnap);
        sendWhatsAppMessage(adminPhone, adminMsg);
      } else if (outcome === "PROCESSING") {
        // Notify user order is processing
        const userMsg = waTemplates.orderProcessing(order.id, order.productNameSnap, order.variantNameSnap);
        sendWhatsAppMessage(order.waNumber, userMsg);
      }
    }

    // Revalidate paths
    revalidatePath("/admin/order");
    revalidatePath("/admin");
    revalidatePath(`/invoice/${orderId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Confirm Payment Error:", error);
    return { success: false, error: error?.message || "Gagal mengonfirmasi pembayaran." };
  }
}
