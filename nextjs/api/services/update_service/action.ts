"use server";

import { fetchUpdateService } from "./fetcher";
import { UpdateServiceRequest } from "./model";

async function fetchUpdateServiceAction(serviceId: string, data: UpdateServiceRequest) {
  return await fetchUpdateService(serviceId, data);
}

export { fetchUpdateServiceAction };

