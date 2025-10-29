import { QueryServiceResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchQueryService(serviceId: string) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services/${serviceId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Service ${serviceId} not found`);
        return null;
      }
      throw new Error(`Failed to fetch service: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryServiceResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching service:", error);
    return null;
  }
}

