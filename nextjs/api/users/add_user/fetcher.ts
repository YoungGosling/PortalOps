import { AddUserRequestSchema, AddUserResponseSchema, AddUserRequest } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchAddUser(userRequest: AddUserRequest) {
  try {
    const validatedRequest = AddUserRequestSchema.parse(userRequest);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to create user: ${response.statusText}`
      );
    }

    const data = await response.json();
    return AddUserResponseSchema.parse(data);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

