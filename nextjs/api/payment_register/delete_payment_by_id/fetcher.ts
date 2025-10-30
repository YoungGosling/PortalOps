import { fetchWithToken } from "@/lib/utils";

export async function deletePaymentById(paymentId: string) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/payment-register/payments/${paymentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete payment by id: ${response.statusText}`);
    }

    // 204 No Content response
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment by id:", error);
    throw error;
  }
}


