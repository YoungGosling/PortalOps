import { ListUserResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchListUser(
  search?: string,
  productId?: string,
  page: number = 1,
  limit: number = 20,
) {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (productId) params.append("productId", productId);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const data = await response.json();
    return ListUserResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    // Return empty results instead of null to prevent UI crashes
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

