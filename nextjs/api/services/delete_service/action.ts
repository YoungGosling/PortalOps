"use server";

import { fetchDeleteService } from "./fetcher";

async function fetchDeleteServiceAction(serviceId: string) {
  return await fetchDeleteService(serviceId);
}

export { fetchDeleteServiceAction };

