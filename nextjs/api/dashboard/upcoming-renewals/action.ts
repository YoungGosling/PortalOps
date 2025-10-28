"use server";

import { fetchUpcomingRenewals } from "./fetcher";

async function fetchUpcomingRenewalsAction(limit: number = 3) {
  return await fetchUpcomingRenewals(limit);
}

export { fetchUpcomingRenewalsAction };

