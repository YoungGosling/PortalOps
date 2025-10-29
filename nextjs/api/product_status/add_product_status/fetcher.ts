import { AddProductStatusRequestSchema, AddProductStatusResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";
import type { AddProductStatusRequest } from "./model";

export async function fetchAddProductStatus(data: AddProductStatusRequest) {
  try {
    // Validate input
    AddProductStatusRequestSchema.parse(data);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/product-statuses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create product status: ${response.statusText}`);
    }

    const result = await response.json();
    return AddProductStatusResponseSchema.parse(result);
  } catch (error) {
    console.error("Error creating product status:", error);
    throw error;
  }
}

