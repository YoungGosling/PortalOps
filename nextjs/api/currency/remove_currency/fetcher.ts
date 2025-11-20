import { fetchWithToken } from "@/lib/utils";

export async function fetchRemoveCurrency(currencyId: number): Promise<void> {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/currencies/${currencyId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to delete currency: ${response.statusText}`);
    }

    // 204 No Content - successful deletion
    return;
  } catch (error) {
    console.error("Error deleting currency:", error);
    throw error;
  }
}


