"use server";

import { fetchQueryCurrencies } from "./fetcher";

async function fetchQueryCurrenciesAction() {
  return await fetchQueryCurrencies();
}

export { fetchQueryCurrenciesAction };


