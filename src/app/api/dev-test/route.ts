import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, variants, products, stockItems, deliveries } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Simple test helper to simulate atomic allocation in neon-http
async function simulateAtomicAllocation(variantId: number, orderId: string) {
  const updateResult = await db.execute(sql`
    UPDATE stock_items
    SET status = 'SOLD', sold_order_id = ${orderId}
    WHERE id = (
      SELECT id
      FROM stock_items
      WHERE variant_id = ${variantId} AND status = 'AVAILABLE'
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, payload_json;
  `);

  const rows = updateResult.rows;
  if (rows.length === 0) {
    return null;
  }
  return rows[0] as { id: number; payload_json: any };
}

export async function GET(request: Request) {
  // Only allow running this test route in development/sandbox mode for security
  if (process.env.TRIPAY_MODE !== "sandbox" && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Only available in sandbox/development mode" }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const results: Record<string, any> = {};

  try {
    // Clean up any stale concurrent orders from previous crashed runs
    await db.delete(deliveries).where(sql`order_id IN ('BGS-CONC-1', 'BGS-CONC-2')`);
    await db
      .update(stockItems)
      .set({ status: "AVAILABLE", soldOrderId: null })
      .where(sql`sold_order_id IN ('BGS-CONC-1', 'BGS-CONC-2')`);
    await db.delete(orders).where(sql`id IN ('BGS-CONC-1', 'BGS-CONC-2')`);
    // ----------------------------------------------------
    // TEST 1: Webhook Signature Verification Test (Bad Signature -> 403)
    // ----------------------------------------------------
    console.log("Running Test 1: Signature Check...");
    const badSignatureRes = await fetch(`${appUrl}/api/webhook/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-callback-signature": "bad-signature-value-12345",
      },
      body: JSON.stringify({
        merchant_ref: "BGS-TEST-SIG",
        status: "PAID",
      }),
      cache: "no-store",
    });

    results.test1_bad_signature_status = badSignatureRes.status;
    results.test1_passed = badSignatureRes.status === 403;

    // ----------------------------------------------------
    // TEST 2: Webhook Idempotency Test (Duplicate Webhook -> Stock used remains 1)
    // ----------------------------------------------------
    console.log("Running Test 2: Idempotency Check...");
    // 2a. Setup a test order in DB
    const testOrderId = `BGS-T2IDMP-${Math.floor(Math.random() * 10000)}`;

    // Find any active variant to use
    const activeVar = await db
      .select({ id: variants.id, price: variants.price, name: variants.name })
      .from(variants)
      .where(eq(variants.isActive, true))
      .limit(1);

    if (activeVar.length === 0) {
      throw new Error("No active variant found to run idempotency test.");
    }

    const variant = activeVar[0];

    // Seed a specific stock item for this test
    const [insertedStock] = await db
      .insert(stockItems)
      .values({
        variantId: variant.id,
        payloadJson: { email: `test-idempotency-${testOrderId}@test.com`, pass: "testpwd123" },
        status: "AVAILABLE",
      })
      .returning();

    // Create a mock order
    await db.insert(orders).values({
      id: testOrderId,
      variantId: variant.id,
      productNameSnap: "Test Product",
      variantNameSnap: variant.name,
      price: variant.price,
      waNumber: "6281234567890",
      email: "test@idempotent.com",
      status: "PENDING",
      paymentRef: "REF-TEST-IDMP",
      paymentQrUrl: "https://qr.com",
      expiredAt: new Date(Date.now() + 1000 * 60 * 60),
    });

    // 2b. Compute valid signature for the webhook payload
    const privateKey = process.env.TRIPAY_PRIVATE_KEY || "sandbox-tripay-private";
    const payload = {
      reference: "REF-TEST-IDMP",
      merchant_ref: testOrderId,
      payment_method_code: "QRIS",
      status: "PAID",
      amount: variant.price,
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", privateKey)
      .update(rawBody)
      .digest("hex");

    // 2c. Send webhook first time
    const webhookRes1 = await fetch(`${appUrl}/api/webhook/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-callback-signature": signature,
      },
      body: rawBody,
      cache: "no-store",
    });
    const webhookData1 = await webhookRes1.json();

    // Verify order is now DELIVERED
    const orderAfter1 = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, testOrderId))
      .limit(1);

    // Verify stock is allocated to this order
    const allocatedStocks = await db
      .select({ status: stockItems.status })
      .from(stockItems)
      .where(eq(stockItems.soldOrderId, testOrderId));

    // 2d. Send webhook second time (duplicate)
    const webhookRes2 = await fetch(`${appUrl}/api/webhook/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-callback-signature": signature,
      },
      body: rawBody,
      cache: "no-store",
    });
    const webhookData2 = await webhookRes2.json();

    results.test2_run = {
      first_webhook_response: webhookData1,
      second_webhook_response: webhookData2,
      order_status_after_1: orderAfter1[0]?.status,
      allocated_stocks_count: allocatedStocks.length,
      allocated_stocks_status: allocatedStocks[0]?.status,
    };

    results.test2_passed =
      webhookRes1.ok &&
      webhookRes2.ok &&
      orderAfter1[0]?.status === "DELIVERED" &&
      allocatedStocks.length === 1 &&
      allocatedStocks[0]?.status === "SOLD" &&
      webhookData2.message === "Order already processed";

    // Clean up test order and delivery
    await db.delete(deliveries).where(eq(deliveries.orderId, testOrderId));
    // Disassociate any stock items that might have been marked sold for this test order
    await db
      .update(stockItems)
      .set({ status: "AVAILABLE", soldOrderId: null })
      .where(eq(stockItems.soldOrderId, testOrderId));
    await db.delete(stockItems).where(eq(stockItems.id, insertedStock.id));
    await db.delete(orders).where(eq(orders.id, testOrderId));

    // ----------------------------------------------------
    // TEST 3: Concurrent Stock Allocation (Atomic Test -> Got different stock items)
    // ----------------------------------------------------
    console.log("Running Test 3: Concurrent Stock Check...");

    // Create mock orders first to satisfy foreign key constraints
    await db.insert(orders).values([
      {
        id: "BGS-CONC-1",
        variantId: variant.id,
        productNameSnap: "Test Product",
        variantNameSnap: variant.name,
        price: variant.price,
        waNumber: "6281234567890",
        email: "conc1@test.com",
        status: "PENDING",
        paymentRef: "REF-CONC-1",
        paymentQrUrl: "https://qr.com",
        expiredAt: new Date(Date.now() + 1000 * 60 * 60),
      },
      {
        id: "BGS-CONC-2",
        variantId: variant.id,
        productNameSnap: "Test Product",
        variantNameSnap: variant.name,
        price: variant.price,
        waNumber: "6281234567890",
        email: "conc2@test.com",
        status: "PENDING",
        paymentRef: "REF-CONC-2",
        paymentQrUrl: "https://qr.com",
        expiredAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    ]);

    // Create 2 test stock items
    const [stockA] = await db
      .insert(stockItems)
      .values({
        variantId: variant.id,
        payloadJson: { email: "stock-a@test.com", pass: "pwdA" },
        status: "AVAILABLE",
      })
      .returning();

    const [stockB] = await db
      .insert(stockItems)
      .values({
        variantId: variant.id,
        payloadJson: { email: "stock-b@test.com", pass: "pwdB" },
        status: "AVAILABLE",
      })
      .returning();

    // Run parallel promises simulating concurrent transactions trying to fetch the stock
    const promise1 = simulateAtomicAllocation(variant.id, "BGS-CONC-1");
    const promise2 = simulateAtomicAllocation(variant.id, "BGS-CONC-2");

    const [allocatedStock1, allocatedStock2] = await Promise.all([promise1, promise2]);

    results.test3_run = {
      allocated_stock_1_id: allocatedStock1?.id,
      allocated_stock_2_id: allocatedStock2?.id,
    };

    results.test3_passed =
      allocatedStock1 !== null &&
      allocatedStock2 !== null &&
      allocatedStock1.id !== allocatedStock2.id;

    // Clean up Test 3 stock items and orders
    // Disassociate first to avoid foreign key issues
    await db
      .update(stockItems)
      .set({ status: "AVAILABLE", soldOrderId: null })
      .where(sql`sold_order_id IN ('BGS-CONC-1', 'BGS-CONC-2')`);

    await db.delete(stockItems).where(eq(stockItems.id, stockA.id));
    await db.delete(stockItems).where(eq(stockItems.id, stockB.id));

    if (allocatedStock1?.id) {
      await db.delete(stockItems).where(eq(stockItems.id, allocatedStock1.id));
    }
    if (allocatedStock2?.id) {
      await db.delete(stockItems).where(eq(stockItems.id, allocatedStock2.id));
    }

    await db.delete(orders).where(eq(orders.id, "BGS-CONC-1"));
    await db.delete(orders).where(eq(orders.id, "BGS-CONC-2"));

    // Overall check
    results.all_tests_passed = results.test1_passed && results.test2_passed && results.test3_passed;
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Test suite failed:", error);
    return NextResponse.json({ error: error?.message || "Test suite crashed" }, { status: 500 });
  }
}
