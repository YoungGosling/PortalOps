import { UpdateUserPermissionRequestSchema, UpdateUserPermissionRequest } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchUpdateUserPermission(
  userId: string,
  permissionRequest: UpdateUserPermissionRequest
) {
  try {
    const validatedRequest = UpdateUserPermissionRequestSchema.parse(permissionRequest);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}/permissions`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to update user permissions: ${response.statusText}`
      );
    }

    // The endpoint returns 204 No Content on success
    return { success: true };
  } catch (error) {
    console.error("Error updating user permissions:", error);
    throw error;
  }
}

