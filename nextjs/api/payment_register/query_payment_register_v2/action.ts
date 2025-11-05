"use server";

import { queryPaymentRegisterV2 } from "./fetcher";

async function queryPaymentRegisterV2Action(
  page: number = 1,
  limit: number = 20,
  search?: string
) {
  return await queryPaymentRegisterV2(page, limit, search);
}

export { queryPaymentRegisterV2Action };






