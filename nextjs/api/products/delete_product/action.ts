"use server";

import { deleteProduct } from "./fetcher";

async function deleteProductAction(productId: string) {
  return await deleteProduct(productId);
}

export { deleteProductAction };

