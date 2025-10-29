"use server";

import { createProduct } from "./fetcher";

async function createProductAction(data: {
  name: string;
  url?: string | null;
  description?: string | null;
  serviceId: string;
  statusId?: number | null;
}) {
  return await createProduct(data);
}

export { createProductAction };

