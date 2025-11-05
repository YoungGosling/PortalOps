"use server";

import { fetchAddProductStatus } from "./fetcher";
import type { AddProductStatusRequest } from "./model";

async function fetchAddProductStatusAction(data: AddProductStatusRequest) {
  return await fetchAddProductStatus(data);
}

export { fetchAddProductStatusAction };






