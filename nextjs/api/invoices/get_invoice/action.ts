"use server";

import { getInvoiceFetcher } from "./fetcher";

/**
 * Server action to retrieve an invoice file.
 * 
 * @param invoice_id - The invoice ID (UUID)
 * @returns Blob containing the invoice file
 */
async function getInvoiceAction(invoice_id: string) {
  return await getInvoiceFetcher(invoice_id);
}

export { getInvoiceAction };






