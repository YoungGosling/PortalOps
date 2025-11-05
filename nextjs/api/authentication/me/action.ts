"use server";

import { fetchUserProfile } from "./fetcher";

async function fetchUserProfileAction(token?: string) {
  return await fetchUserProfile(token);
}

export { fetchUserProfileAction };

