import { UpdateProductStatusRequestSchema, UpdateProductStatusResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";
import type { UpdateProductStatusRequest } from "./model";

export async function fetchUpdateProductStatus(
  statusId: number,
  data: UpdateProductStatusRequest
) {
  try {
    // Validate input
    UpdateProductStatusRequestSchema.parse(data);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/product-statuses/${statusId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update product status: ${response.statusText}`);
    }

    const result = await response.json();
    return UpdateProductStatusResponseSchema.parse(result);
  } catch (error) {
    console.error("Error updating product status:", error);
    throw error;
  }
}


