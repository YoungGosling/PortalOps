"use server";

import { queryPaymentRegisterV2 } from "./fetcher";

async function queryPaymentRegisterV2Action(
  page: number = 1,
  limit: number = 20
) {
  return await queryPaymentRegisterV2(page, limit);
}

export { queryPaymentRegisterV2Action };


