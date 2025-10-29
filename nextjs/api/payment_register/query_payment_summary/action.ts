"use server";

import { queryPaymentSummary } from "./fetcher";

async function queryPaymentSummaryAction() {
  return await queryPaymentSummary();
}

export { queryPaymentSummaryAction };

