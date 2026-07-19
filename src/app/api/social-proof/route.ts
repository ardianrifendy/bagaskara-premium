import { NextResponse } from "next/server";
import { db, orders } from "@/db";
import { eq, desc } from "drizzle-orm";
import { maskWhatsApp } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch last 10 DELIVERED orders
    const fetchedOrders = await db
      .select({
        id: orders.id,
        waNumber: orders.waNumber,
        productNameSnap: orders.productNameSnap,
        variantNameSnap: orders.variantNameSnap,
        deliveredAt: orders.deliveredAt,
      })
      .from(orders)
      .where(eq(orders.status, "DELIVERED"))
      .orderBy(desc(orders.deliveredAt))
      .limit(10);

    // If no real orders yet, return mock data for social proof demo
    if (fetchedOrders.length === 0) {
      const now = new Date();
      const mockOrders = [
        {
          id: "BGS-MOCK001",
          maskedWa: "62812xx••••86",
          productNameSnap: "Netflix 4K Premium",
          variantNameSnap: "1 Bulan Shared",
          deliveredAt: new Date(now.getTime() - 1000 * 60 * 12).toISOString(), // 12 mins ago
        },
        {
          id: "BGS-MOCK002",
          maskedWa: "62857xx••••44",
          productNameSnap: "Spotify Premium",
          variantNameSnap: "1 Bulan Individual",
          deliveredAt: new Date(now.getTime() - 1000 * 60 * 35).toISOString(), // 35 mins ago
        },
        {
          id: "BGS-MOCK003",
          maskedWa: "62899xx••••12",
          productNameSnap: "Canva Pro",
          variantNameSnap: "1 Bulan Premium Member",
          deliveredAt: new Date(now.getTime() - 1000 * 60 * 75).toISOString(), // 1 hour ago
        },
        {
          id: "BGS-MOCK004",
          maskedWa: "62813xx••••99",
          productNameSnap: "ChatGPT Plus",
          variantNameSnap: "1 Bulan Shared",
          deliveredAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        },
        {
          id: "BGS-MOCK005",
          maskedWa: "62852xx••••31",
          productNameSnap: "CapCut Pro",
          variantNameSnap: "1 Bulan Premium",
          deliveredAt: new Date(now.getTime() - 1000 * 60 * 240).toISOString(), // 4 hours ago
        },
      ];
      return NextResponse.json(mockOrders);
    }

    // Map real database orders and mask WA
    const data = fetchedOrders.map((order) => ({
      id: order.id,
      maskedWa: maskWhatsApp(order.waNumber),
      productNameSnap: order.productNameSnap,
      variantNameSnap: order.variantNameSnap,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch social proof:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
