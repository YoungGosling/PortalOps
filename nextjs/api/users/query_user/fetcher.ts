import { QueryUserResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchQueryUser(userId: string) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`User ${userId} not found`);
        return null;
      }
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryUserResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

