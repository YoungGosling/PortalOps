import { fetchWithToken } from "@/lib/utils";

export async function updatePaymentInfo(
  productId: string,
  data: Record<string, any> | FormData
) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payment-register/${productId}`,
      {
        method: "PUT",
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? {} : {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update payment info: ${response.statusText}`);
    }

    // 204 No Content response
    return { success: true };
  } catch (error) {
    console.error("Error updating payment info:", error);
    throw error;
  }
}






