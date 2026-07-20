import { getPromoCodes } from "@/app/actions/promo";
import AdminPromoManager from "@/components/AdminPromoManager";

export const dynamic = "force-dynamic";

export default async function AdminPromoPage() {
  const promoCodesList = await getPromoCodes();

  return <AdminPromoManager initialPromoCodes={promoCodesList} />;
}
