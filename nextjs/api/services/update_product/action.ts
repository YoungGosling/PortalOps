"use server";

import { fetchUpdateProduct } from "./fetcher";
import { UpdateProductRequest } from "./model";

async function fetchUpdateProductAction(serviceId: string, productId: string, data: UpdateProductRequest) {
  return await fetchUpdateProduct(serviceId, productId, data);
}

export { fetchUpdateProductAction };

