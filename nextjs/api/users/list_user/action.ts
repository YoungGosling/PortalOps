"use server";

import { fetchListUser } from "./fetcher";

async function fetchListUserAction(
  search?: string,
  productId?: string,
  page: number = 1,
  limit: number = 20,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean,
) {
  return await fetchListUser(search, productId, page, limit, sortBy, sortOrder, isActive);
}

export { fetchListUserAction };

