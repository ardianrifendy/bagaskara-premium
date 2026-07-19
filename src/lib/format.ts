/**
 * Formats a number into Indonesian Rupiah (Rp) without decimal digits.
 * Example: 150000 -> "Rp150.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, ""); // Remove space if any
}

/**
 * Formats a date or string into Indonesian date format.
 * Example: 2026-07-19 -> "19 Juli 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats a date or string into Indonesian date-time format.
 * Example: 2026-07-19 14:30:00 -> "19 Juli 2026, 14:30 WIB"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  const dateStr = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr}, ${timeStr} WIB`;
}

/**
 * Masks a WhatsApp number. Converts "08..." to "628..." first.
 * Pattern: 62xx••••[last 2 digits]
 * Example: "08123456789" -> "62xx••••89"
 */
export function maskWhatsApp(phone: string): string {
  if (!phone) return "";

  // Remove non-digit characters
  let clean = phone.replace(/\D/g, "");

  // Convert 0 to 62
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }

  // Fallback for short numbers
  if (clean.length < 6) {
    return clean;
  }

  const firstTwo = clean.slice(0, 2);
  const lastTwo = clean.slice(-2);

  return `${firstTwo}xx••••${lastTwo}`;
}

/**
 * Normalizes a WhatsApp phone number to start with "62".
 * Example: "08123456789" -> "628123456789"
 */
export function normalizeWhatsApp(phone: string): string {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }
  return clean;
}
