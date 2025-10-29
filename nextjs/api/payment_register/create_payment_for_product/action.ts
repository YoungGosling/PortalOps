"use server";

import { createPaymentForProduct } from "./fetcher";

async function createPaymentForProductAction(
  productId: string,
  data: Record<string, any> | FormData
) {
  return await createPaymentForProduct(productId, data);
}

export { createPaymentForProductAction };

