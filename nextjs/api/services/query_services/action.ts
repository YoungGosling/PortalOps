"use server";

import { fetchQueryServices } from "./fetcher";

async function fetchQueryServicesAction(page: number = 1, limit: number = 20) {
  return await fetchQueryServices(page, limit);
}

export { fetchQueryServicesAction };

