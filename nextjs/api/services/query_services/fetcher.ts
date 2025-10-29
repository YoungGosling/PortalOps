import { QueryServicesResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchQueryServices(page: number = 1, limit: number = 20) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryServicesResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching services:", error);
    return {
      data: [],
      pagination: {
        total: 0,
        page: page,
        limit: limit,
      },
    };
  }
}

