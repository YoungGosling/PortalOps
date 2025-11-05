import { fetchWithToken } from "@/lib/utils";

export async function fetchRemoveProductStatus(statusId: number): Promise<void> {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/product-statuses/${statusId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete product status: ${response.statusText}`);
    }

    // 204 No Content - successful deletion
    return;
  } catch (error) {
    console.error("Error deleting product status:", error);
    throw error;
  }
}






