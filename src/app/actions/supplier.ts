"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSession } from "@/lib/session";
import { fetchSupplierBalance, fetchSupplierProducts, SupplierProduct } from "@/lib/provider";

/**
 * Fetch supplier balance securely on the server
 */
export async function getSupplierBalanceAction() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { success: false, error: "Akses tidak sah." };
  }

  try {
    const allSettings = await db.select().from(settings);
    const apiKey = allSettings.find((s) => s.key === "supplier_api_key")?.value || "";
    const baseUrl = allSettings.find((s) => s.key === "supplier_base_url")?.value || "http://51.77.244.194/v1";

    if (!apiKey) {
      return { success: false, error: "API Key Supplier belum dikonfigurasi." };
    }

    const data = await fetchSupplierBalance(apiKey, baseUrl);
    return { success: true, balance: data.balance, membership: data.membership || "standard" };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil saldo supplier." };
  }
}

/**
 * Fetch supplier products list securely on the server
 */
export async function getSupplierProductsAction(): Promise<{ success: boolean; products?: SupplierProduct[]; error?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { success: false, error: "Akses tidak sah." };
  }

  try {
    const allSettings = await db.select().from(settings);
    const apiKey = allSettings.find((s) => s.key === "supplier_api_key")?.value || "";
    const baseUrl = allSettings.find((s) => s.key === "supplier_base_url")?.value || "http://51.77.244.194/v1";

    if (!apiKey) {
      return { success: false, error: "API Key Supplier belum dikonfigurasi." };
    }

    const products = await fetchSupplierProducts(apiKey, baseUrl);
    return { success: true, products };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil produk supplier." };
  }
}
