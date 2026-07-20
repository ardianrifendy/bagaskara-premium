export interface SupplierProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  publicPrice?: number;
  imageUrl?: string;
  inStock?: boolean;
  stock?: number;
  delivery?: {
    type: string;
  };
}

export interface SupplierBalanceResponse {
  telegramId?: number;
  username?: string;
  balance: number;
  membership?: string;
}

export interface SupplierOrderResponse {
  orderId: string;
  status: "pending" | "paid" | "delivered" | "failed";
  product: {
    id: string;
    name: string;
  };
  quantity: number;
  amount: number;
  deliveredKey?: string;
  deliveredKeys?: string[];
  error?: string;
}

/**
 * Fetch list of products from ProdSeller API
 */
export async function fetchSupplierProducts(apiKey: string, baseUrl: string): Promise<SupplierProduct[]> {
  try {
    const cleanUrl = baseUrl.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/products`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
      next: { revalidate: 30 }, // cache for 30s
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }

    return data.products || [];
  } catch (error: any) {
    console.error("fetchSupplierProducts error:", error);
    throw new Error(error.message || "Gagal menghubungi API Supplier (Products).");
  }
}

/**
 * Fetch balance from ProdSeller API
 */
export async function fetchSupplierBalance(apiKey: string, baseUrl: string): Promise<SupplierBalanceResponse> {
  try {
    const cleanUrl = baseUrl.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/balance`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }

    return data as SupplierBalanceResponse;
  } catch (error: any) {
    console.error("fetchSupplierBalance error:", error);
    throw new Error(error.message || "Gagal menghubungi API Supplier (Balance).");
  }
}

/**
 * Place a new order on ProdSeller API with Idempotency Key
 */
export async function createSupplierOrder(
  apiKey: string,
  baseUrl: string,
  supplierProductId: string,
  quantity: number = 1,
  idempotencyKey: string
): Promise<SupplierOrderResponse> {
  try {
    const cleanUrl = baseUrl.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/orders`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Idempotency-Key": idempotencyKey.substring(0, 100), // Max 100 chars
      },
      body: JSON.stringify({
        productId: supplierProductId,
        quantity,
      }),
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }

    return data as SupplierOrderResponse;
  } catch (error: any) {
    console.error("createSupplierOrder error:", error);
    throw new Error(error.message || "Gagal memesan produk ke API Supplier.");
  }
}
