"use server";

import { fetchUpdateProductStatus } from "./fetcher";
import type { UpdateProductStatusRequest } from "./model";

async function fetchUpdateProductStatusAction(
  statusId: number,
  data: UpdateProductStatusRequest
) {
  return await fetchUpdateProductStatus(statusId, data);
}

export { fetchUpdateProductStatusAction };

