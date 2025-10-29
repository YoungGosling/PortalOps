import { UploadInvoicesResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

/**
 * Upload one or more invoice files for a specific payment record.
 * Supports PDF, DOCX, XLSX, XLS, PPTX, TXT, CSV, JPG, JPEG, PNG formats.
 * 
 * @param payment_info_id - The payment record ID (UUID)
 * @param files - Array of File objects to upload
 * @returns Array of uploaded invoice information
 */
export async function uploadInvoicesFetcher(
  payment_info_id: string,
  files: File[]
) {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/invoices/payments/${payment_info_id}/invoices`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to upload invoices: ${response.statusText}`
      );
    }

    const data = await response.json();
    return UploadInvoicesResponseSchema.parse(data);
  } catch (error) {
    console.error("Error uploading invoices:", error);
    throw error;
  }
}

