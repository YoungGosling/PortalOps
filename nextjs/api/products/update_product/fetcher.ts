import { ProductUpdateWithUrlSchema, ProductSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function updateProduct(
  productId: string,
  data: {
    name: string;
    url?: string | null;
    description?: string | null;
    serviceId: string;
    statusId?: number | null;
  }
) {
  try {
    const validatedData = ProductUpdateWithUrlSchema.parse(data);
    
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productId}`,
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
    return ProductSchema.parse(responseData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

