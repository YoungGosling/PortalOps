import { UpdatePaymentMethodRequestSchema, UpdatePaymentMethodResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";
import type { UpdatePaymentMethodRequest } from "./model";

export async function fetchUpdatePaymentMethod(
  methodId: number,
  data: UpdatePaymentMethodRequest
) {
  try {
    // Validate input
    UpdatePaymentMethodRequestSchema.parse(data);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/payment-methods/${methodId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update payment method: ${response.statusText}`);
    }

    const result = await response.json();
    return UpdatePaymentMethodResponseSchema.parse(result);
  } catch (error) {
    console.error("Error updating payment method:", error);
    throw error;
  }
}






