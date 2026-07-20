import { db } from "@/db";
import { orders, deliveries, variants, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceClient from "@/components/InvoiceClient";
import Link from "next/link";

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
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-8 text-center shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-3 tracking-tight">Invoice Tidak Ditemukan</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
            Invoice dengan ID <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{id}</span> tidak terdaftar di sistem kami. Silakan periksa kembali atau hubungi CS jika Anda mengalami kendala.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold rounded-full py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const order = orderResult[0];

  // 1.5. Auto-expire if order is PENDING and past expiredAt
  if (order.status === "PENDING" && new Date(order.expiredAt) <= new Date()) {
    await db
      .update(orders)
      .set({
        status: "EXPIRED",
        statusChangedBy: "system:auto_timeout",
        statusChangedAt: new Date(),
      })
      .where(eq(orders.id, id));
    order.status = "EXPIRED";
  }

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
