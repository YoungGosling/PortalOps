"use server";

import { fetchQueryProductStatuses } from "./fetcher";

async function fetchQueryProductStatusesAction() {
  return await fetchQueryProductStatuses();
}

export { fetchQueryProductStatusesAction };

