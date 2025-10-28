import { RecentActivitiesResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchRecentActivities(limit: number = 10) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/recent-activities?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch recent activities: ${response.statusText}`);
    }

    const data = await response.json();
    return RecentActivitiesResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
}

