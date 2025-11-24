"use server";

import { createProduct } from "./fetcher";

async function createProductAction(data: {
  name: string;
  url?: string | null;
  description?: string | null;
  serviceId: string;
  statusId?: number | null;
  adminUserIds?: string[];
}) {
  return await createProduct(data);
}

export { createProductAction };

