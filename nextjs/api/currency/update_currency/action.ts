"use server";

import { fetchUpdateCurrency } from "./fetcher";
import type { UpdateCurrencyRequest } from "./model";

async function fetchUpdateCurrencyAction(currencyId: number, data: UpdateCurrencyRequest) {
  return await fetchUpdateCurrency(currencyId, data);
}

export { fetchUpdateCurrencyAction };


