"use server";

import { fetchQueryService } from "./fetcher";

async function fetchQueryServiceAction(serviceId: string) {
  return await fetchQueryService(serviceId);
}

export { fetchQueryServiceAction };

