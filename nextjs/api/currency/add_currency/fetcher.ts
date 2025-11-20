import { AddCurrencyRequestSchema, AddCurrencyResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";
import type { AddCurrencyRequest } from "./model";

export async function fetchAddCurrency(data: AddCurrencyRequest) {
  try {
    // Validate input
    AddCurrencyRequestSchema.parse(data);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/currencies`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create currency: ${response.statusText}`);
    }

    const result = await response.json();
    return AddCurrencyResponseSchema.parse(result);
  } catch (error) {
    console.error("Error creating currency:", error);
    throw error;
  }
}


