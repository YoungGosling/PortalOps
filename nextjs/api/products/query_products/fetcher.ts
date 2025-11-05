import { QueryProductsResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function queryProducts(
  serviceId?: string | null,
  page: number = 1,
  limit: number = 20,
  search?: string,
) {
  try {
    const params = new URLSearchParams();
    if (serviceId) {
      params.append("serviceId", serviceId);
    }
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) {
      params.append("search", search);
    }

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to query products: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform backend response format { data, pagination } to { products, total, page, limit }
    const transformedData = {
      products: data.data || [],
      total: data.pagination?.total || 0,
      page: data.pagination?.page || page,
      limit: data.pagination?.limit || limit,
    };
    
    return QueryProductsResponseSchema.parse(transformedData);
  } catch (error) {
    console.error("Error querying products:", error);
    return {
      products: [],
      total: 0,
      page: page,
      limit: limit,
    };
  }
}

