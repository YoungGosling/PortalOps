"use server";

import { fetchListUser } from "./fetcher";

async function fetchListUserAction(
  search?: string,
  productId?: string,
  page: number = 1,
  limit: number = 20,
) {
  return await fetchListUser(search, productId, page, limit);
}

export { fetchListUserAction };

