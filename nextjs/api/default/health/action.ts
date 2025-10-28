"use server";

import { fetchHealthCheck } from "./fetcher";

async function fetchHealthCheckAction() {
  return await fetchHealthCheck();
}

export { fetchHealthCheckAction };

