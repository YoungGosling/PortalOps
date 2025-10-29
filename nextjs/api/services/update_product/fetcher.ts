import { UpdateProductRequestSchema, UpdateProductResponseSchema, UpdateProductRequest } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchUpdateProduct(serviceId: string, productId: string, data: UpdateProductRequest) {
  try {
    // Validate input
    const validatedData = UpdateProductRequestSchema.parse(data);
    
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services/${serviceId}/products/${productId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.statusText}`);
    }

    const responseData = await response.json();
    return UpdateProductResponseSchema.parse(responseData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

