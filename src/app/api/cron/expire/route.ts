import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Verify authorization header
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("Cron Error: CRON_SECRET environment variable is not defined.");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Cron Warning: Unauthorized access attempt to expire route.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 2. Perform DB update to mark pending expired orders
    const expiredOrders = await db
      .update(orders)
      .set({
        status: "EXPIRED",
        statusChangedBy: "cron",
        statusChangedAt: now,
      })
      .where(and(eq(orders.status, "PENDING"), lte(orders.expiredAt, now)))
      .returning({
        id: orders.id,
      });

    console.log(`Cron completed: Expired ${expiredOrders.length} orders.`, expiredOrders.map(o => o.id));

    return NextResponse.json({
      success: true,
      expiredCount: expiredOrders.length,
      expiredIds: expiredOrders.map((o) => o.id),
    });
  } catch (error) {
    console.error("Cron expire script failed with error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
