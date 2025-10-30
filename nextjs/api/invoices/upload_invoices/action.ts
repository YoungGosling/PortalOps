"use server";

import { uploadInvoicesFetcher } from "./fetcher";

/**
 * Server action to upload invoices for a payment record.
 * 
 * @param payment_info_id - The payment record ID (UUID)
 * @param files - Array of File objects to upload
 */
async function uploadInvoicesAction(
  payment_info_id: string,
  files: File[]
) {
  return await uploadInvoicesFetcher(payment_info_id, files);
}

export { uploadInvoicesAction };


