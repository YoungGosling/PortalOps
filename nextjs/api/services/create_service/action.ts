"use server";

import { fetchCreateService } from "./fetcher";
import { CreateServiceRequest } from "./model";

async function fetchCreateServiceAction(data: CreateServiceRequest) {
  return await fetchCreateService(data);
}

export { fetchCreateServiceAction };

