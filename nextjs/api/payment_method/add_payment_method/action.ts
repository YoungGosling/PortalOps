"use server";

import { fetchAddPaymentMethod } from "./fetcher";
import type { AddPaymentMethodRequest } from "./model";

async function fetchAddPaymentMethodAction(data: AddPaymentMethodRequest) {
  return await fetchAddPaymentMethod(data);
}

export { fetchAddPaymentMethodAction };

