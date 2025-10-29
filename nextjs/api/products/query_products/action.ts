"use server";

import { queryProducts } from "./fetcher";

async function queryProductsAction(
  serviceId?: string | null,
  page: number = 1,
  limit: number = 20,
) {
  return await queryProducts(serviceId, page, limit);
}

export { queryProductsAction };

