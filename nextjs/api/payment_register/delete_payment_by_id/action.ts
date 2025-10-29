"use server";

import { deletePaymentById } from "./fetcher";

async function deletePaymentByIdAction(paymentId: string) {
  return await deletePaymentById(paymentId);
}

export { deletePaymentByIdAction };

