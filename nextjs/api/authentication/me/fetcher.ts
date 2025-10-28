import { UserProfileSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchUserProfile() {
  try {
    const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return UserProfileSchema.parse(data);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

