import { fetchWithToken } from "@/lib/utils";

/**
 * Delete a specific invoice file.
 * Returns 204 No Content on success.
 * 
 * @param invoice_id - The invoice ID (UUID) to delete
 * @returns void (204 No Content)
 */
export async function deleteInvoiceFetcher(invoice_id: string): Promise<void> {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/invoices/${invoice_id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete invoice: ${response.statusText}`
      );
    }

    // 204 No Content - no response body
    return;
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
}






