import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, variants, products, settings, deliveries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyCallbackSignature } from "@/lib/payment/tripay";
import { sendWhatsAppMessage, waTemplates } from "@/lib/wa";
import { processSupplierFulfillment } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Read raw body text for signature calculation
    const rawBody = await request.text();

    // 2. Read signature header
    const headerSignature = request.headers.get("x-callback-signature") || "";

    if (!headerSignature) {
      console.warn("Webhook Warning: Missing x-callback-signature header.");
      return NextResponse.json({ error: "Missing signature header" }, { status: 403 });
    }

    // 3. Verify Tripay HMAC signature
    const isValidSignature = verifyCallbackSignature(rawBody, headerSignature);
    if (!isValidSignature) {
      console.warn("Webhook Warning: Webhook signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // 4. Parse payload
    const payload = JSON.parse(rawBody);
    const orderId = payload.merchant_ref;
    const gatewayStatus = payload.status; // PAID, EXPIRED, FAILED

    console.log(`Webhook Received: Order ID = ${orderId} | Status = ${gatewayStatus}`);

    // 5. Look up order in database
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderResult.length === 0) {
      console.error(`Webhook Error: Order ${orderId} not found in database.`);
      return NextResponse.json({ error: "Order not found" }, { status: 200 }); // Return 200 to stop gateway retries
    }

    const order = orderResult[0];

    // Idempotency: If order status is not PENDING, do not process again
    if (order.status !== "PENDING") {
      console.log(`Webhook Info: Order ${orderId} already processed (Status = ${order.status}). Skipping.`);
      return NextResponse.json({ success: true, message: "Order already processed" }, { status: 200 });
    }

    // Process payment status
    if (gatewayStatus === "PAID") {
      // Fetch variant and product
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
        console.error(`Webhook Error: Variant not found for order ${orderId}.`);
        return NextResponse.json({ error: "Variant not found" }, { status: 200 });
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
          })
          .where(eq(orders.id, orderId));

        // Delegate to supplier fulfillment engine
        await processSupplierFulfillment(orderId);
      } else if (variant.deliveryMode === "AUTO_STOCK") {
        // Atomic UPDATE ... RETURNING query with FOR UPDATE SKIP LOCKED
        // This is safe from concurrent race conditions and supported in neon-http
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
              statusChangedBy: "webhook",
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
              statusChangedBy: "webhook",
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
            statusChangedBy: "webhook",
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
          console.warn(`WARNING: Stock empty for variant ID ${order.variantId}. Manual process required.`);
          // Notify user order is processing
          const userMsg = waTemplates.orderProcessing(order.id, order.productNameSnap, order.variantNameSnap);
          sendWhatsAppMessage(order.waNumber, userMsg);

          // Notify admin about stock alert
          const csSetting = await db
            .select()
            .from(settings)
            .where(eq(settings.key, "cs_whatsapp"))
            .limit(1);
          const adminPhone = csSetting[0]?.value || "628123456789";

          const adminMsg = waTemplates.stockEmptyAlert(order.id, order.productNameSnap, order.variantNameSnap);
          sendWhatsAppMessage(adminPhone, adminMsg);
        } else if (outcome === "PROCESSING") {
          // Notify user order is processing
          const userMsg = waTemplates.orderProcessing(order.id, order.productNameSnap, order.variantNameSnap);
          sendWhatsAppMessage(order.waNumber, userMsg);
        }
      }
    } else if (gatewayStatus === "EXPIRED" || gatewayStatus === "FAILED") {
      // Update order status to EXPIRED or FAILED
      await db
        .update(orders)
        .set({
          status: gatewayStatus === "EXPIRED" ? "EXPIRED" : "FAILED",
          statusChangedBy: "webhook",
          statusChangedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing crashed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
