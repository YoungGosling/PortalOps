"use server";

import { fetchQueryServices } from "./fetcher";

async function fetchQueryServicesAction(page: number = 1, limit: number = 20, search?: string) {
  return await fetchQueryServices(page, limit, search);
}

export { fetchQueryServicesAction };

