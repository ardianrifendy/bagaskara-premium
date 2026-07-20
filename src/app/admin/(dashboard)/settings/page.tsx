import { db } from "@/db";
import { settings } from "@/db/schema";
import AdminSettingsManager from "@/components/AdminSettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  // Query all configuration keys from database
  const allSettings = await db
    .select()
    .from(settings);

  const getSettingValue = (key: string, defaultValue: string) => {
    return allSettings.find((s) => s.key === key)?.value || defaultValue;
  };

  const csWhatsapp = getSettingValue("cs_whatsapp", "6289513679939");
  const warrantyText = getSettingValue(
    "warranty_text",
    "Garansi mencakup: akun tidak premium, salah password, profile bermasalah. Garansi tidak berlaku apabila Anda merubah password atau detail akun."
  );
  const socialProofEnabled = getSettingValue("social_proof_enabled", "true") === "true";
  const staticQris = getSettingValue(
    "static_qris",
    "00020101021126610014COM.GO-JEK.WWW01189360091431482851640210G1482851640303UMI51440014ID.CO.QRIS.WWW0215ID10254032776980303UMI5204573253033605802ID5914Bagaskara Cell6006GRESIK61056117162070703A0163040A9C"
  );
  const supplierApiKey = getSettingValue("supplier_api_key", "");
  const supplierBaseUrl = getSettingValue("supplier_base_url", "http://51.77.244.194/v1");

  const defaultSettings = {
    csWhatsapp,
    warrantyText,
    socialProofEnabled,
    staticQris,
    supplierApiKey,
    supplierBaseUrl,
  };

  return (
    <div className="min-h-screen">
      <AdminSettingsManager defaultSettings={defaultSettings} />
    </div>
  );
}
