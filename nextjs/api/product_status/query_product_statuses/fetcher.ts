import { QueryProductStatusesResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchQueryProductStatuses() {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/product-statuses`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch product statuses: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryProductStatusesResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching product statuses:", error);
    return [];
  }
}






