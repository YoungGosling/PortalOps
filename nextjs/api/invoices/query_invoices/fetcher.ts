import { QueryInvoicesResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchQueryInvoices(productId?: string) {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/master-files/invoices`;
    
    // Add optional product_id filter
    if (productId) {
      url += `?product_id=${productId}`;
    }

    const response = await fetchWithToken(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryInvoicesResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

