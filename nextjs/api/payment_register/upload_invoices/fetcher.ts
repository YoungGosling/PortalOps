import { UploadInvoicesResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function uploadInvoices(productId: string, files: File[]) {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/payment-register/${productId}/invoices`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to upload invoices: ${response.statusText}`);
    }

    const data = await response.json();
    return UploadInvoicesResponseSchema.parse(data);
  } catch (error) {
    console.error("Error uploading invoices:", error);
    throw error;
  }
}






