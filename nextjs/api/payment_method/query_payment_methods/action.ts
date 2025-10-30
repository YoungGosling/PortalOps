"use server";

import { fetchQueryPaymentMethods } from "./fetcher";

async function fetchQueryPaymentMethodsAction() {
  return await fetchQueryPaymentMethods();
}

export { fetchQueryPaymentMethodsAction };


