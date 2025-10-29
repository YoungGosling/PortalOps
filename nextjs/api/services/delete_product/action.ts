"use server";

import { fetchDeleteProduct } from "./fetcher";

async function fetchDeleteProductAction(serviceId: string, productId: string) {
  return await fetchDeleteProduct(serviceId, productId);
}

export { fetchDeleteProductAction };

