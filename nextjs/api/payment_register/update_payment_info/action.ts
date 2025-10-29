"use server";

import { updatePaymentInfo } from "./fetcher";

async function updatePaymentInfoAction(
  productId: string,
  data: Record<string, any> | FormData
) {
  return await updatePaymentInfo(productId, data);
}

export { updatePaymentInfoAction };

