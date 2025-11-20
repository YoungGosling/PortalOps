import { UpdateCurrencyRequestSchema, UpdateCurrencyResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";
import type { UpdateCurrencyRequest } from "./model";

export async function fetchUpdateCurrency(currencyId: number, data: UpdateCurrencyRequest) {
  try {
    // Validate input
    UpdateCurrencyRequestSchema.parse(data);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/currencies/${currencyId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to update currency: ${response.statusText}`);
    }

    const result = await response.json();
    return UpdateCurrencyResponseSchema.parse(result);
  } catch (error) {
    console.error("Error updating currency:", error);
    throw error;
  }
}


