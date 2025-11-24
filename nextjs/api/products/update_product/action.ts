"use server";

import { updateProduct } from "./fetcher";

async function updateProductAction(
  productId: string,
  data: {
    name: string;
    url?: string | null;
    description?: string | null;
    serviceId: string;
    statusId?: number | null;
    adminUserIds?: string[];
  }
) {
  return await updateProduct(productId, data);
}

export { updateProductAction };

