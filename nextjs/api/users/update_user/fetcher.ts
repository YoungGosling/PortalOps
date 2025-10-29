import { UpdateUserRequestSchema, UpdateUserResponseSchema, UpdateUserRequest } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchUpdateUser(userId: string, userRequest: UpdateUserRequest) {
  try {
    const validatedRequest = UpdateUserRequestSchema.parse(userRequest);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}`,
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
        errorData.detail || `Failed to update user: ${response.statusText}`
      );
    }

    const data = await response.json();
    return UpdateUserResponseSchema.parse(data);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

