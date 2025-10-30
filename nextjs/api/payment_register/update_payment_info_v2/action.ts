"use server";

import { updatePaymentInfoV2 } from "./fetcher";

async function updatePaymentInfoV2Action(
  productId: string,
  data: Record<string, any> | FormData
) {
  return await updatePaymentInfoV2(productId, data);
}

export { updatePaymentInfoV2Action };


