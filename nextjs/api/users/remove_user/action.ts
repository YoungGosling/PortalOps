"use server";

import { fetchRemoveUser } from "./fetcher";

async function fetchRemoveUserAction(userId: string) {
  return await fetchRemoveUser(userId);
}

export { fetchRemoveUserAction };

