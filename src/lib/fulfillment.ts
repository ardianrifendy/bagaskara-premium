import { db } from "@/db";
import { orders, variants, products, deliveries, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSupplierOrder } from "@/lib/provider";
import { sendWhatsAppMessage, waTemplates } from "@/lib/wa";

interface FulfillmentResult {
  success: boolean;
  outcome: "DELIVERED" | "PROCESSING" | "FAILED";
  error?: string;
}

/**
 * Parses delivered credentials from ProdSeller.
 * Supported format: "email|password" or "email|password|profile|pin|catatan".
 */
export function parseDeliveredKey(key: string): {
  email: string;
  pass: string;
  profile: string;
  pin: string;
  note: string;
} {
  const cleanKey = key.trim();
  const parts = cleanKey.split("|").map((p) => p.trim());

  if (parts.length >= 2) {
    return {
      email: parts[0] || "",
      pass: parts[1] || "",
      profile: parts[2] || "-",
      pin: parts[3] || "-",
      note: parts.slice(4).join(" | ") || "",
    };
  }

  // Fallback if formatting doesn't use pipe
  return {
    email: "",
    pass: "",
    profile: "-",
    pin: "-",
    note: cleanKey,
  };
}

/**
 * Shared engine for executing automatic fulfillment via ProdSeller reseller API.
 */
export async function processSupplierFulfillment(orderId: string): Promise<FulfillmentResult> {
  console.log(`Fulfillment Engine: Starting process for Order ID = ${orderId}`);

  try {
    // 1. Fetch order details
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderResult.length === 0) {
      return { success: false, outcome: "FAILED", error: "Order tidak ditemukan di database." };
    }

    const order = orderResult[0];

    // 2. Fetch variant and product
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
      return { success: false, outcome: "FAILED", error: "Varian produk tidak ditemukan." };
    }

    const { variant, product } = variantResult[0];

    if (variant.deliveryMode !== "PROVIDER_API") {
      return { success: false, outcome: "FAILED", error: "Varian ini tidak menggunakan pengiriman PROVIDER_API." };
    }

    if (!variant.supplierProductId) {
      // Missing supplier configuration
      const errorMsg = "ID Produk Supplier belum dikonfigurasi pada varian produk ini.";
      await handleFulfillmentFailure(order, product.name, variant.name, errorMsg);
      return { success: false, outcome: "PROCESSING", error: errorMsg };
    }

    // 3. Load supplier credentials from settings
    const allSettings = await db.select().from(settings);
    const apiKey = allSettings.find((s) => s.key === "supplier_api_key")?.value || "";
    const baseUrl = allSettings.find((s) => s.key === "supplier_base_url")?.value || "http://51.77.244.194/v1";

    if (!apiKey) {
      const errorMsg = "API Key Supplier belum dikonfigurasi di Pengaturan Toko.";
      await handleFulfillmentFailure(order, product.name, variant.name, errorMsg);
      return { success: false, outcome: "PROCESSING", error: errorMsg };
    }

    // 4. Place order with reseller API (Use orderId as Idempotency-Key)
    try {
      console.log(`Fulfillment Engine: Requesting API Supplier with Idempotency-Key = ${order.id}`);
      const supplierOrder = await createSupplierOrder(
        apiKey,
        baseUrl,
        variant.supplierProductId,
        1, // quantity always 1
        order.id
      );

      const credentialString = supplierOrder.deliveredKey || supplierOrder.deliveredKeys?.[0];

      if (supplierOrder.status === "delivered" || credentialString) {
        // Parse account credentials
        const parsedAccount = parseDeliveredKey(credentialString || "");
        const warrantyUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * variant.warrantyDays);

        // Save delivery snapshot
        await db.insert(deliveries).values({
          orderId: order.id,
          payloadJson: parsedAccount,
          warrantyUntil: warrantyUntil,
        });

        // Update order status to DELIVERED
        await db
          .update(orders)
          .set({
            status: "DELIVERED",
            paidAt: order.paidAt || new Date(),
            deliveredAt: new Date(),
            statusChangedBy: "system_provider",
            statusChangedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        console.log(`Fulfillment Engine: SUCCESS! Order ${order.id} automatically delivered via API.`);

        // Send delivery details to customer via WhatsApp
        const msg = waTemplates.accountDelivered(
          order.id,
          order.productNameSnap,
          order.variantNameSnap,
          parsedAccount,
          variant.warrantyDays
        );
        await sendWhatsAppMessage(order.waNumber, msg);

        return { success: true, outcome: "DELIVERED" };
      } else {
        // API order response status is not delivered
        const errorMsg = supplierOrder.error || `Status order supplier: ${supplierOrder.status}`;
        await handleFulfillmentFailure(order, product.name, variant.name, errorMsg);
        return { success: false, outcome: "PROCESSING", error: errorMsg };
      }
    } catch (apiError: any) {
      console.error("Fulfillment Engine API call error:", apiError);
      const errorMsg = apiError.message || "Gagal menghubungi API Supplier.";
      await handleFulfillmentFailure(order, product.name, variant.name, errorMsg);
      return { success: false, outcome: "PROCESSING", error: errorMsg };
    }
  } catch (error: any) {
    console.error("Fulfillment Engine crash:", error);
    return { success: false, outcome: "FAILED", error: error.message || "Crash pada mesin fulfillment." };
  }
}

/**
 * Handle fulfillment failure: update order status to PROCESSING and notify admin + user
 */
async function handleFulfillmentFailure(
  order: any,
  productName: string,
  variantName: string,
  errorMsg: string
) {
  // Update order status to PROCESSING so admin can check
  await db
    .update(orders)
    .set({
      status: "PROCESSING",
      paidAt: order.paidAt || new Date(),
      statusChangedBy: "system_provider_fail",
      statusChangedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  // Notify customer order is processing
  const userMsg = waTemplates.orderProcessing(order.id, order.productNameSnap, order.variantNameSnap);
  await sendWhatsAppMessage(order.waNumber, userMsg);

  // Fetch admin WhatsApp contact from settings
  const csSetting = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "cs_whatsapp"))
    .limit(1);
  const adminPhone = csSetting[0]?.value || "628123456789";

  // Notify admin about supplier API warning
  const adminMsg = waTemplates.supplierErrorAlert(
    order.id,
    order.productNameSnap,
    order.variantNameSnap,
    errorMsg
  );
  await sendWhatsAppMessage(adminPhone, adminMsg);

  console.warn(`Fulfillment Engine Warning: Automated delivery failed for Order ${order.id}. Alerted Admin.`);
}
