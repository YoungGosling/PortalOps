import { QueryServicesResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchQueryServices(page: number = 1, limit: number = 20, search?: string) {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services?${params.toString()}`,
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

