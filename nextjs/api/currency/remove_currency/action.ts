"use server";

import { fetchRemoveCurrency } from "./fetcher";

async function fetchRemoveCurrencyAction(currencyId: number) {
  return await fetchRemoveCurrency(currencyId);
}

export { fetchRemoveCurrencyAction };


