import { db } from "@/db";
import { orders, deliveries } from "@/db/schema";
import { desc, eq, and, lte } from "drizzle-orm";
import AdminOrderManager from "@/components/AdminOrderManager";

export const dynamic = "force-dynamic";

interface AdminOrderPageProps {
  searchParams: {
    search?: string;
  };
}

export default async function AdminOrdersPage({ searchParams }: AdminOrderPageProps) {
  // 0. Auto-expire any PENDING orders past their expiration time
  const now = new Date();
  await db
    .update(orders)
    .set({
      status: "EXPIRED",
      statusChangedBy: "system:auto_timeout",
      statusChangedAt: now,
    })
    .where(and(eq(orders.status, "PENDING"), lte(orders.expiredAt, now)));

  // 1. Fetch all orders ordered by newest
  const allOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  // 2. Fetch all deliveries snapshots
  const allDeliveries = await db
    .select()
    .from(deliveries)
    .orderBy(desc(deliveries.createdAt));

  // Serialize datasets to prevent dates warning
  const serializedOrders = allOrders.map((o) => ({
    ...o,
    expiredAt: o.expiredAt.toISOString(),
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
    statusChangedAt: o.statusChangedAt ? o.statusChangedAt.toISOString() : null,
  }));

  const serializedDeliveries = allDeliveries.map((d) => ({
    ...d,
    warrantyUntil: d.warrantyUntil.toISOString(),
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen">
      <AdminOrderManager
        orders={serializedOrders}
        deliveries={serializedDeliveries}
        defaultSearchQuery={searchParams.search}
      />
    </div>
  );
}
