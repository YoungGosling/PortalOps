import { CreateProductRequestSchema, CreateProductResponseSchema, CreateProductRequest } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchCreateProduct(serviceId: string, data: CreateProductRequest) {
  try {
    // Validate input
    const validatedData = CreateProductRequestSchema.parse(data);
    
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services/${serviceId}/products`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create product: ${response.statusText}`);
    }

    const responseData = await response.json();
    return CreateProductResponseSchema.parse(responseData);
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

