"use server";

import { fetchUpdateUserPermission } from "./fetcher";
import { UpdateUserPermissionRequest } from "./model";

async function fetchUpdateUserPermissionAction(
  userId: string,
  permissionRequest: UpdateUserPermissionRequest
) {
  return await fetchUpdateUserPermission(userId, permissionRequest);
}

export { fetchUpdateUserPermissionAction };

