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
      })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ status: orderResult[0].status });
  } catch (error) {
    console.error(`Failed to poll status for order ${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
