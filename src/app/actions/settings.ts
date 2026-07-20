"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

const settingsSchema = z.object({
  csWhatsapp: z.string().min(1, "WhatsApp CS wajib diisi"),
  warrantyText: z.string().min(1, "Teks garansi wajib diisi"),
  socialProofEnabled: z.boolean(),
  staticQris: z.string().min(1, "String QRIS Statis wajib diisi"),
  supplierApiKey: z.string().optional(),
  supplierBaseUrl: z.string().optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function saveSettings(input: SettingsInput) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { success: false, error: "Akses tidak sah." };
  }

  const validation = settingsSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Validasi gagal" };
  }

  const {
    csWhatsapp,
    warrantyText,
    socialProofEnabled,
    staticQris,
    supplierApiKey = "",
    supplierBaseUrl = "",
  } = validation.data;

  try {
    // Update individual configuration keys
    await db
      .update(settings)
      .set({ value: csWhatsapp.trim() })
      .where(eq(settings.key, "cs_whatsapp"));

    await db
      .update(settings)
      .set({ value: warrantyText.trim() })
      .where(eq(settings.key, "warranty_text"));

    await db
      .update(settings)
      .set({ value: socialProofEnabled ? "true" : "false" })
      .where(eq(settings.key, "social_proof_enabled"));

    await db
      .update(settings)
      .set({ value: staticQris.trim() })
      .where(eq(settings.key, "static_qris"));

    // Upsert supplier settings to guarantee existence
    await db
      .insert(settings)
      .values({ key: "supplier_api_key", value: supplierApiKey.trim() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: supplierApiKey.trim() },
      });

    await db
      .insert(settings)
      .values({ key: "supplier_base_url", value: supplierBaseUrl.trim() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: supplierBaseUrl.trim() },
      });

    // Revalidate paths to refresh page state on next visit
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Save Settings Error:", error);
    return { success: false, error: error?.message || "Gagal menyimpan perubahan pengaturan." };
  }
}
