"use server";

import { fetchAddCurrency } from "./fetcher";
import type { AddCurrencyRequest } from "./model";

async function fetchAddCurrencyAction(data: AddCurrencyRequest) {
  return await fetchAddCurrency(data);
}

export { fetchAddCurrencyAction };


