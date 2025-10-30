import { QueryPaymentMethodsResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchQueryPaymentMethods() {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/payment-methods`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryPaymentMethodsResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return [];
  }
}


