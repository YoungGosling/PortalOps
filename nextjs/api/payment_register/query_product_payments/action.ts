"use server";

import { queryProductPayments } from "./fetcher";

async function queryProductPaymentsAction(productId: string) {
  return await queryProductPayments(productId);
}

export { queryProductPaymentsAction };

