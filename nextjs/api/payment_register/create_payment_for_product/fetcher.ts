import { CreatePaymentForProductResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function createPaymentForProduct(
  productId: string,
  data: Record<string, any> | FormData
) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/payment-register/products/${productId}/payments`,
      {
        method: "POST",
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? {} : {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create payment for product: ${response.statusText}`);
    }

    const responseData = await response.json();
    return CreatePaymentForProductResponseSchema.parse(responseData);
  } catch (error) {
    console.error("Error creating payment for product:", error);
    throw error;
  }
}

