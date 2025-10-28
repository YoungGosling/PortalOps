import { UpcomingResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchUpcomingRenewals(limit: number = 3) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/upcoming-renewals?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch upcoming renewals: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('data打印:',data);
    return UpcomingResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching upcoming renewals:", error);
    return [];
  }
}

