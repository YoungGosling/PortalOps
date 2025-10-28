import { PendingTasksCountSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchPendingTasksCount() {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/pending-tasks-count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch pending tasks count: ${response.statusText}`);
    }

    const data = await response.json();
    return PendingTasksCountSchema.parse(data);
  } catch (error) {
    console.error("Error fetching pending tasks count:", error);
    return {
      pending_count: 0,
    };
  }
}

