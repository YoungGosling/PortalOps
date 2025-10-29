"use server";

import { fetchUpdateUser } from "./fetcher";
import { UpdateUserRequest } from "./model";

async function fetchUpdateUserAction(userId: string, userRequest: UpdateUserRequest) {
  return await fetchUpdateUser(userId, userRequest);
}

export { fetchUpdateUserAction };

