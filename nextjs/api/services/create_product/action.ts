"use server";

import { fetchCreateProduct } from "./fetcher";
import { CreateProductRequest } from "./model";

async function fetchCreateProductAction(serviceId: string, data: CreateProductRequest) {
  return await fetchCreateProduct(serviceId, data);
}

export { fetchCreateProductAction };

