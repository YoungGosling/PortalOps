"use server";

import { uploadInvoices } from "./fetcher";

async function uploadInvoicesAction(productId: string, files: File[]) {
  return await uploadInvoices(productId, files);
}

export { uploadInvoicesAction };

