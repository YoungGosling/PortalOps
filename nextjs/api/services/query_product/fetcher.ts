import { QueryProductResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchQueryProduct(serviceId: string, productId: string) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services/${serviceId}/products/${productId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Product ${productId} not found in service ${serviceId}`);
        return null;
      }
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryProductResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

