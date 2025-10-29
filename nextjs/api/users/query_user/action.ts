"use server";

import { fetchQueryUser } from "./fetcher";

async function fetchQueryUserAction(userId: string) {
  return await fetchQueryUser(userId);
}

export { fetchQueryUserAction };

