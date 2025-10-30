"use server";

import { queryPaymentRegister } from "./fetcher";

async function queryPaymentRegisterAction() {
  return await queryPaymentRegister();
}

export { queryPaymentRegisterAction };


