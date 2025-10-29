"use server";

import { fetchUpdatePaymentMethod } from "./fetcher";
import type { UpdatePaymentMethodRequest } from "./model";

async function fetchUpdatePaymentMethodAction(
  methodId: number,
  data: UpdatePaymentMethodRequest
) {
  return await fetchUpdatePaymentMethod(methodId, data);
}

export { fetchUpdatePaymentMethodAction };

