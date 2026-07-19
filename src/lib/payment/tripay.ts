import crypto from "crypto";

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

const getTripayConfig = () => {
  const apiKey = process.env.TRIPAY_API_KEY;
  const privateKey = process.env.TRIPAY_PRIVATE_KEY;
  const merchantCode = process.env.TRIPAY_MERCHANT_CODE;
  const mode = process.env.TRIPAY_MODE || "sandbox";

  return { apiKey, privateKey, merchantCode, mode };
};

/**
 * Calculates HMAC-SHA256 signature for Tripay transactions creation
 */
export function calculateCreateSignature(
  merchantCode: string,
  merchantRef: string,
  amount: number,
  privateKey: string
): string {
  const data = merchantCode + merchantRef + amount.toString();
  return crypto.createHmac("sha256", privateKey).update(data).digest("hex");
}

/**
 * Verifies callback signature from Tripay using timingSafeEqual
 */
export function verifyCallbackSignature(rawBody: string, headerSignature: string): boolean {
  const { privateKey } = getTripayConfig();
  if (!privateKey) {
    console.error("Tripay Error: TRIPAY_PRIVATE_KEY is not defined.");
    return false;
  }

  try {
    const calculatedSignature = crypto
      .createHmac("sha256", privateKey)
      .update(rawBody)
      .digest("hex");

    const a = Buffer.from(calculatedSignature, "utf-8");
    const b = Buffer.from(headerSignature, "utf-8");

    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(a, b);
  } catch (error) {
    console.error("Failed to verify callback signature:", error);
    return false;
  }
}

/**
 * Sends a request to Tripay API to create a QRIS transaction
 */
export async function createTransaction({
  orderId,
  amount,
  customerName,
  email,
  phone,
  productName,
}: CreateTransactionParams): Promise<TripayTransactionResult> {
  const { apiKey, privateKey, merchantCode, mode } = getTripayConfig();

  if (!apiKey || !privateKey || !merchantCode) {
    throw new Error("Tripay Error: Missing API Key, Private Key, or Merchant Code in environment variables.");
  }

  const baseUrl = mode === "production" ? "https://tripay.co.id/api" : "https://tripay.co.id/api-sandbox";

  // Calculate signature
  const signature = calculateCreateSignature(merchantCode, orderId, amount, privateKey);

  // Normalize phone number to start with "62"
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }

  const payload = {
    method: "QRIS",
    merchant_ref: orderId,
    amount: amount,
    customer_name: customerName,
    customer_email: email,
    customer_phone: cleanPhone,
    order_items: [
      {
        name: productName,
        price: amount,
        quantity: 1,
      },
    ],
    signature: signature,
  };

  try {
    const response = await fetch(`${baseUrl}/transaction/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error("Tripay Create Transaction Error Response:", result);
      throw new Error(result.message || "Failed to create transaction on Tripay.");
    }

    const { reference, qr_url, qr_string, expiry_timestamp } = result.data;

    // Tripay QRIS response contains either qr_url (image) or qr_string.
    // We prefer qr_url, but if empty we can use or construct a qr image from qr_string
    const finalQrUrl = qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr_string || "")}`;
    const expiredAt = new Date(expiry_timestamp * 1000);

    return {
      reference,
      qrUrl: finalQrUrl,
      expiredAt,
    };
  } catch (error) {
    console.error("Failed inside createTransaction wrapper:", error);
    throw error;
  }
}
