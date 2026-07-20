import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  const defaultSettings = {
    csWhatsapp,
    warrantyText,
    socialProofEnabled,
  };

  return (
    <div className="min-h-screen">
      <AdminSettingsManager defaultSettings={defaultSettings} />
    </div>
  );
}
