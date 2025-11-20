"use server";

import { fetchCurrencyStats } from "./fetcher";

async function fetchCurrencyStatsAction(
  currencyCode: string,
  startDate?: string,
  endDate?: string
) {
  return await fetchCurrencyStats(currencyCode, startDate, endDate);
}

export { fetchCurrencyStatsAction };

