import { fetchWithToken } from "@/lib/utils";

export async function updatePaymentInfoV2(
  productId: string,
  data: Record<string, any> | FormData
) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/payment-register/${productId}`,
      {
        method: "PUT",
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? {} : {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update payment info v2: ${response.statusText}`);
    }

    // 204 No Content response
    return { success: true };
  } catch (error) {
    console.error("Error updating payment info v2:", error);
    throw error;
  }
}






