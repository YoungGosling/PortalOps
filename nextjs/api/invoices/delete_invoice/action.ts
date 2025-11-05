"use server";

import { deleteInvoiceFetcher } from "./fetcher";

/**
 * Server action to delete an invoice file.
 * 
 * @param invoice_id - The invoice ID (UUID) to delete
 */
async function deleteInvoiceAction(invoice_id: string) {
  return await deleteInvoiceFetcher(invoice_id);
}

export { deleteInvoiceAction };






