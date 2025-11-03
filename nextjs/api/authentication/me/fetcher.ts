import { UserProfileSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";
import { UnauthorizedError } from "@/lib/errors";

export async function fetchUserProfile() {
  try {
    const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Check if it's an unauthorized error (401)
      if (response.status === 401) {
        throw new UnauthorizedError(`Failed to fetch user profile: ${response.statusText}`);
      }
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return UserProfileSchema.parse(data);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

