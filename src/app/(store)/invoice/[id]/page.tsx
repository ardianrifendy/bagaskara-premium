import { db } from "@/db";
import { orders, deliveries, variants, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceClient from "@/components/InvoiceClient";

export const dynamic = "force-dynamic";

interface InvoicePageProps {
  params: {
    id: string;
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  // 1. Fetch order
  const orderResult = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (orderResult.length === 0) {
    notFound();
  }

  const order = orderResult[0];

  // 2. Fetch associated variant to get warrantyDays
  const variantResult = await db
    .select({
      warrantyDays: variants.warrantyDays,
    })
    .from(variants)
    .where(eq(variants.id, order.variantId))
    .limit(1);

  const warrantyDays = variantResult[0]?.warrantyDays || 30; // fallback default 30 days

  // 2.5. Fetch cs_whatsapp from settings
  const settingsResult = await db
    .select()
    .from(settings);
  const csWhatsapp = settingsResult.find((s) => s.key === "cs_whatsapp")?.value || "6289513679939";

  // 3. Fetch delivery snapshot if status is DELIVERED
  let deliveryResult = null;
  if (order.status === "DELIVERED") {
    const fetchDelivery = await db
      .select({
        payloadJson: deliveries.payloadJson,
        warrantyUntil: deliveries.warrantyUntil,
      })
      .from(deliveries)
      .where(eq(deliveries.orderId, order.id))
      .limit(1);

    if (fetchDelivery.length > 0) {
      deliveryResult = {
        payloadJson: fetchDelivery[0].payloadJson,
        warrantyUntil: fetchDelivery[0].warrantyUntil.toISOString(),
      };
    }
  }

  // Serialize dates to prevent client component serialization warnings
  const serializedOrder = {
    ...order,
    expiredAt: order.expiredAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
  };

  return (
    <InvoiceClient
      order={serializedOrder}
      delivery={deliveryResult}
      warrantyDays={warrantyDays}
      csWhatsapp={csWhatsapp}
    />
  );
}
