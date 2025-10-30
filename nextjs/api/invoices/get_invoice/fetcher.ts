import { fetchWithToken } from "@/lib/utils";

/**
 * Retrieve a specific invoice file for preview or download.
 * Returns the file as a Blob.
 * 
 * @param invoice_id - The invoice ID (UUID)
 * @returns Blob containing the invoice file
 */
export async function getInvoiceFetcher(invoice_id: string): Promise<Blob> {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/invoices/${invoice_id}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to get invoice: ${response.statusText}`
      );
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error getting invoice:", error);
    throw error;
  }
}


