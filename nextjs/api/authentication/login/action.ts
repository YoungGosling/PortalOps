"use server";

import { fetchLogin } from "./fetcher";

async function fetchLoginAction(email: string, password: string) {
  return await fetchLogin(email, password);
}

export { fetchLoginAction };

