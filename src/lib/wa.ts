/**
 * WhatsApp Notification helper.
 * Communicates with the external WA bot API running on a separate VPS.
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const waBotUrl = process.env.WA_BOT_URL;
  const waBotKey = process.env.WA_BOT_KEY;

  if (!waBotUrl || !waBotKey) {
    console.warn("WA Bot Warning: WA_BOT_URL or WA_BOT_KEY is not defined. Skipping WA send.");
    return false;
  }

  // Normalize recipient number to 62xxx
  let cleanTo = to.replace(/\D/g, "");
  if (cleanTo.startsWith("0")) {
    cleanTo = "62" + cleanTo.slice(1);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    const response = await fetch(`${waBotUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": waBotKey,
      },
      body: JSON.stringify({
        to: cleanTo,
        message: message,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`WA Bot API responded with error (${response.status}):`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("WA Bot API call failed:", error);
    return false;
  }
}

/**
 * Compiles a WhatsApp notification template for different order events.
 */
export const waTemplates = {
  orderCreated: (orderId: string, productName: string, variantName: string, amount: number, qrisUrl: string) => {
    return `Halo! Pesanan Anda di Bagaskara Premium telah dibuat.\n\n` +
      `*ID Invoice:* ${orderId}\n` +
      `*Produk:* ${productName} - ${variantName}\n` +
      `*Total Bayar:* Rp ${amount.toLocaleString("id-ID")}\n\n` +
      `Silakan bayar menggunakan QRIS dinamis Anda di: ${qrisUrl}\n\n` +
      `Pesanan akan diproses otomatis segera setelah pembayaran terkonfirmasi. Terima kasih!`;
  },

  orderProcessing: (orderId: string, productName: string, variantName: string) => {
    return `Pembayaran Terkonfirmasi!\n\n` +
      `*ID Invoice:* ${orderId}\n` +
      `*Produk:* ${productName} - ${variantName}\n\n` +
      `Pesanan Anda sedang diproses oleh admin. Mohon ditunggu maksimal 30 menit. Kami akan mengirimkan detail akun Anda segera setelah selesai.`;
  },

  accountDelivered: (
    orderId: string,
    productName: string,
    variantName: string,
    accountData: { email: string; pass: string; profile?: string; pin?: string; note?: string },
    warrantyDays: number
  ) => {
    const profileText = accountData.profile && accountData.profile !== "-" ? `\n*Profil:* ${accountData.profile}` : "";
    const pinText = accountData.pin && accountData.pin !== "-" ? `\n*PIN:* ${accountData.pin}` : "";
    const noteText = accountData.note ? `\n*Catatan:* ${accountData.note}` : "";

    return `Pesanan Anda Selesai!\n\n` +
      `*ID Invoice:* ${orderId}\n` +
      `*Produk:* ${productName} - ${variantName}\n\n` +
      `*Detail Akun Premium:*\n` +
      `• *Email:* ${accountData.email}\n` +
      `• *Password:* ${accountData.pass}${profileText}${pinText}${noteText}\n\n` +
      `*Masa Garansi:* ${warrantyDays} Hari\n\n` +
      `Jika ada kendala silakan hubungi CS kami dengan melampirkan ID Invoice. Terima kasih atas kepercayaan Anda!`;
  },

  stockEmptyAlert: (orderId: string, productName: string, variantName: string) => {
    return `⚠️ *ALERT STOK KOSONG ADMIN* ⚠️\n\n` +
      `Order *${orderId}* (${productName} - ${variantName}) telah dibayar tetapi stok habis.\n` +
      `Status order diset ke PROCESSING. Harap segera restock akun dan kirim secara manual melalui panel admin!`;
  },

  supplierErrorAlert: (orderId: string, productName: string, variantName: string, errorDetail: string) => {
    return `⚠️ *ALERT ERROR SUPPLIER API* ⚠️\n\n` +
      `Order *${orderId}* (${productName} - ${variantName}) telah dibayar tetapi gagal diproses otomatis via API Supplier.\n\n` +
      `*Error:* ${errorDetail}\n\n` +
      `Status order diset ke PROCESSING. Harap segera periksa saldo/stok supplier atau proses secara manual melalui panel admin!`;
  },
};
