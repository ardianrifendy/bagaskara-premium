import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  try {
    const orderResult = await db
      .select({
        status: orders.status,
        expiredAt: orders.expiredAt,
      })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResult[0];

    if (order.status === "PENDING" && new Date(order.expiredAt) <= new Date()) {
      await db
        .update(orders)
        .set({
          status: "EXPIRED",
          statusChangedBy: "system:auto_timeout",
          statusChangedAt: new Date(),
        })
        .where(eq(orders.id, id));
      return NextResponse.json({ status: "EXPIRED" });
    }

    return NextResponse.json({ status: order.status });
  } catch (error) {
    console.error(`Failed to poll status for order ${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
