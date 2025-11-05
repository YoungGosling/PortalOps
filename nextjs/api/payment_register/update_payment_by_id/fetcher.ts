import { fetchWithToken } from "@/lib/utils";

export async function updatePaymentById(
  paymentId: string,
  data: Record<string, any> | FormData
) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/payment-register/payments/${paymentId}`,
      {
        method: "PUT",
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? {} : {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update payment by id: ${response.statusText}`);
    }

    // 204 No Content response
    return { success: true };
  } catch (error) {
    console.error("Error updating payment by id:", error);
    throw error;
  }
}






