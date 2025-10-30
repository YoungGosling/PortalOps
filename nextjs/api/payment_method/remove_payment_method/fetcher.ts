import { fetchWithToken } from "@/lib/utils";

export async function fetchRemovePaymentMethod(methodId: number): Promise<void> {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/payment-methods/${methodId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete payment method: ${response.statusText}`);
    }

    // 204 No Content - successful deletion
    return;
  } catch (error) {
    console.error("Error deleting payment method:", error);
    throw error;
  }
}


