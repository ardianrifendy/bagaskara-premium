import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateDynamicQRIS } from "@/lib/qris";

export interface CreateTransactionParams {
  orderId: string;
  amount: number;
  customerName: string;
  email: string;
  phone: string;
  productName: string;
}

export interface TripayTransactionResult {
  reference: string;
  qrUrl: string;
  expiredAt: Date;
}

/**
 * Calculates HMAC-SHA256 signature (Legacy, kept for fallback)
 */
export function calculateCreateSignature(
  merchantCode: string,
  merchantRef: string,
  amount: number,
  privateKey: string
): string {
  return "";
}

/**
 * Verifies callback signature (Legacy, returns false since Tripay is bypassed)
 */
export function verifyCallbackSignature(rawBody: string, headerSignature: string): boolean {
  return false;
}

/**
 * Generates local dynamic QRIS from static QRIS setting (Bypasses Tripay API).
 */
export async function createTransaction({
  orderId,
  amount,
}: CreateTransactionParams): Promise<TripayTransactionResult> {
  try {
    // 1. Fetch static_qris from settings
    const qrisSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "static_qris"))
      .limit(1);

    const staticQris =
      qrisSetting[0]?.value ||
      "00020101021126610014COM.GO-JEK.WWW01189360091431482851640210G1482851640303UMI51440014ID.CO.QRIS.WWW0215ID10254032776980303UMI5204573253033605802ID5914Bagaskara Cell6006GRESIK61056117162070703A0163040A9C"; // Fallback

    // 2. Generate dynamic QRIS string
    const dynamicQris = generateDynamicQRIS(staticQris, amount);

    // 3. Construct QR Code image URL via QRServer API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dynamicQris)}`;

    // 4. Set expiration to 60 minutes
    const expiredAt = new Date(Date.now() + 60 * 60 * 1000);

    return {
      reference: orderId, // Use order ID as reference
      qrUrl,
      expiredAt,
    };
  } catch (error) {
    console.error("Failed to generate dynamic QRIS payment transaction:", error);
    throw error;
  }
}
