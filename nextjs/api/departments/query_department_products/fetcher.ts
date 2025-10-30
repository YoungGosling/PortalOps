import { DepartmentProductsResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

/**
 * Get all products assigned to a department
 * GET /api/departments/{department_id}/products
 */
export async function fetchDepartmentProducts(departmentId: string) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/departments/${departmentId}/products`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch department products: ${response.statusText}`);
    }

    const data = await response.json();
    return DepartmentProductsResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching department products:", error);
    throw error;
  }
}


