"use server";

import { updatePaymentById } from "./fetcher";

async function updatePaymentByIdAction(
  paymentId: string,
  data: Record<string, any> | FormData
) {
  return await updatePaymentById(paymentId, data);
}

export { updatePaymentByIdAction };


