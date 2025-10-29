"use server";

import { fetchRemoveProductStatus } from "./fetcher";

async function fetchRemoveProductStatusAction(statusId: number) {
  return await fetchRemoveProductStatus(statusId);
}

export { fetchRemoveProductStatusAction };

