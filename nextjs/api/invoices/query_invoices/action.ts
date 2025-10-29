"use server";

import { fetchQueryInvoices } from "./fetcher";

async function fetchQueryInvoicesAction(productId?: string) {
  return await fetchQueryInvoices(productId);
}

export { fetchQueryInvoicesAction };

