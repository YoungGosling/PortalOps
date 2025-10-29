import { AddPaymentMethodRequestSchema, AddPaymentMethodResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";
import type { AddPaymentMethodRequest } from "./model";

export async function fetchAddPaymentMethod(data: AddPaymentMethodRequest) {
  try {
    // Validate input
    AddPaymentMethodRequestSchema.parse(data);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/payment-methods`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create payment method: ${response.statusText}`);
    }

    const result = await response.json();
    return AddPaymentMethodResponseSchema.parse(result);
  } catch (error) {
    console.error("Error creating payment method:", error);
    throw error;
  }
}

