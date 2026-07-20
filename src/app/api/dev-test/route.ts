import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, variants, products, stockItems, deliveries } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { confirmPaymentManual } from "@/app/actions/admin-order";

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
  // HARD BLOCK: return 404 in production — this route must never be accessible
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  // Additional guard: only allow in sandbox/development mode
  if (process.env.TRIPAY_MODE !== "sandbox") {
    return NextResponse.json({ error: "Only available in sandbox/development mode" }, { status: 403 });
  }

  const results: Record<string, any> = {};

  try {
    // Clean up any stale concurrent orders from previous runs
    await db.delete(deliveries).where(sql`order_id IN ('BGS-CONC-1', 'BGS-CONC-2')`);
    await db
      .update(stockItems)
      .set({ status: "AVAILABLE", soldOrderId: null })
      .where(sql`sold_order_id IN ('BGS-CONC-1', 'BGS-CONC-2')`);
    await db.delete(orders).where(sql`id IN ('BGS-CONC-1', 'BGS-CONC-2')`);

    // ----------------------------------------------------
    // TEST 1: confirmPaymentManual Security Verification (Without Session -> Access Denied)
    // ----------------------------------------------------
    console.log("Running Test 1: Action Security Check...");
    const secRes = await confirmPaymentManual("BGS-DUMMY-123");

    results.test1_response = secRes;
    results.test1_passed = secRes.success === false && secRes.error === "Akses tidak sah.";

    // ----------------------------------------------------
    // TEST 2: Payment Confirmation Database Logic Test (Simulator)
    // ----------------------------------------------------
    console.log("Running Test 2: Confirmation Database Logic Check...");
    const testOrderId = `BGS-T2CONF-${Math.floor(Math.random() * 10000)}`;

    // Find any active variant to use
    const activeVar = await db
      .select({ id: variants.id, price: variants.price, name: variants.name })
      .from(variants)
      .where(eq(variants.isActive, true))
      .limit(1);

    if (activeVar.length === 0) {
      throw new Error("No active variant found to run logic test.");
    }

    const variant = activeVar[0];

    // Seed a specific stock item for this test
    const [insertedStock] = await db
      .insert(stockItems)
      .values({
        variantId: variant.id,
        payloadJson: { email: `test-conf-${testOrderId}@test.com`, pass: "testpwd123" },
        status: "AVAILABLE",
      })
      .returning();

    // Create a mock pending order
    await db.insert(orders).values({
      id: testOrderId,
      variantId: variant.id,
      productNameSnap: "Test Product",
      variantNameSnap: variant.name,
      price: variant.price,
      waNumber: "6281234567890",
      email: "test@conf.com",
      status: "PENDING",
      paymentRef: testOrderId,
      paymentQrUrl: "https://qr.com",
      expiredAt: new Date(Date.now() + 1000 * 60 * 60),
    });

    // Simulate database updates equivalent to confirmPaymentManual
    // First time confirmation
    let outcome: "DELIVERED" | "STOCK_EMPTY" = "STOCK_EMPTY";
    let allocatedStockPayload: any = null;

    const updateResult = await db.execute(sql`
      UPDATE stock_items
      SET status = 'SOLD', sold_order_id = ${testOrderId}
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

    if (updateResult.rows.length > 0) {
      const stockRow = updateResult.rows[0] as { id: number; payload_json: any };
      allocatedStockPayload = stockRow.payload_json;

      const warrantyUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
      await db.insert(deliveries).values({
        orderId: testOrderId,
        payloadJson: allocatedStockPayload,
        warrantyUntil: warrantyUntil,
      });

      await db
        .update(orders)
        .set({
          status: "DELIVERED",
          paidAt: new Date(),
          deliveredAt: new Date(),
          statusChangedBy: "admin:tester",
          statusChangedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      outcome = "DELIVERED";
    }

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

    results.test2_run = {
      outcome,
      order_status_after: orderAfter1[0]?.status,
      allocated_stocks_count: allocatedStocks.length,
      allocated_stocks_status: allocatedStocks[0]?.status,
    };

    results.test2_passed =
      outcome === "DELIVERED" &&
      orderAfter1[0]?.status === "DELIVERED" &&
      allocatedStocks.length === 1 &&
      allocatedStocks[0]?.status === "SOLD";

    // Clean up test order and delivery
    await db.delete(deliveries).where(eq(deliveries.orderId, testOrderId));
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
