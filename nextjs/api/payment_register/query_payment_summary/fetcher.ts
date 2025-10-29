import { PaymentSummarySchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function queryPaymentSummary() {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payment-register/summary`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to query payment summary: ${response.statusText}`);
    }

    const data = await response.json();
    return PaymentSummarySchema.parse(data);
  } catch (error) {
    console.error("Error querying payment summary:", error);
    return { incompleteCount: 0 };
  }
}

