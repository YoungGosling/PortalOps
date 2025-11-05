"use server";

import { fetchRemovePaymentMethod } from "./fetcher";

async function fetchRemovePaymentMethodAction(methodId: number) {
  return await fetchRemovePaymentMethod(methodId);
}

export { fetchRemovePaymentMethodAction };






