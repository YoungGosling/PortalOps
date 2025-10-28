"use server";

import { fetchUserProfile } from "./fetcher";

async function fetchUserProfileAction() {
  return await fetchUserProfile();
}

export { fetchUserProfileAction };

