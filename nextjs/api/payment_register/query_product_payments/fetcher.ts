import { QueryProductPaymentsResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function queryProductPayments(productId: string) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/payment-register/products/${productId}/payments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to query product payments: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryProductPaymentsResponseSchema.parse(data);
  } catch (error) {
    console.error("Error querying product payments:", error);
    return [];
  }
}






