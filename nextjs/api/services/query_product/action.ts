"use server";

import { fetchQueryProduct } from "./fetcher";

async function fetchQueryProductAction(serviceId: string, productId: string) {
  return await fetchQueryProduct(serviceId, productId);
}

export { fetchQueryProductAction };

