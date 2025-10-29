import { fetchWithToken } from "@/lib/utils";

export async function fetchRemoveUser(userId: string) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to delete user: ${response.statusText}`
      );
    }

    // The endpoint returns 204 No Content on success
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

