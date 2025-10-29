"use server";

import { fetchAddUser } from "./fetcher";
import { AddUserRequest } from "./model";

async function fetchAddUserAction(userRequest: AddUserRequest) {
  return await fetchAddUser(userRequest);
}

export { fetchAddUserAction };

