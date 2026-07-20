import crypto from "crypto";

/**
 * Calculates CRC16 CCITT (false) checksum for EMVCo/QRIS compliance.
 * Polynomial: 0x1021
 * Initial value: 0xFFFF
 */
export function calculateCRC16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    crc ^= (code << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Helper to parse standard EMVCo/QRIS TLV (Tag-Length-Value) format
 */
export function parseQRIS(qris: string): Map<string, string> {
  const map = new Map<string, string>();
  let i = 0;
  while (i < qris.length) {
    if (i + 4 > qris.length) break;
    const tag = qris.substring(i, i + 2);
    const lengthStr = qris.substring(i + 2, i + 4);
    const length = parseInt(lengthStr, 10);
    if (isNaN(length)) break;

    const value = qris.substring(i + 4, i + 4 + length);
    map.set(tag, value);
    i += 4 + length;
  }
  return map;
}

/**
 * Converts a Static QRIS payload string to a Dynamic QRIS payload string with specified transaction amount.
 *
 * @param staticQris Static QRIS string payload (e.g. 000201010211...)
 * @param amount The transaction amount (nominal)
 */
export function generateDynamicQRIS(staticQris: string, amount: number): string {
  if (!staticQris || !staticQris.trim()) {
    throw new Error("QRIS Statis tidak boleh kosong.");
  }

  // 1. Parse static QRIS TLV tags
  const tagsMap = parseQRIS(staticQris.trim());

  // 2. Change Point of Initiation Method from Static (11) to Dynamic (12)
  tagsMap.set("01", "12");

  // 3. Set Transaction Amount (Tag 54)
  // Amount is a string representation of the number
  tagsMap.set("54", amount.toString());

  // 4. Remove existing CRC (Tag 63) since it will be recalculated
  tagsMap.delete("63");

  // 5. Reconstruct QRIS string in sorted tag order (ascending)
  let reconstructed = "";
  const sortedTags = Array.from(tagsMap.keys()).sort();
  for (const tag of sortedTags) {
    const value = tagsMap.get(tag)!;
    const lengthStr = value.length.toString().padStart(2, "0");
    reconstructed += tag + lengthStr + value;
  }

  // 6. Append Tag 63 ID + Length of CRC (04)
  reconstructed += "6304";

  // 7. Calculate and append new CRC16
  const newCrc = calculateCRC16(reconstructed);
  return reconstructed + newCrc;
}
