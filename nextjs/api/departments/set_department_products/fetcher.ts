import { 
  SetDepartmentProductsRequestSchema, 
  SetDepartmentProductsResponseSchema 
} from "./model";
import { fetchWithToken } from "@/lib/utils";
import type { SetDepartmentProductsRequest } from "./model";

/**
 * Set (replace) all product assignments for a department
 * PUT /api/departments/{department_id}/products
 */
export async function setDepartmentProducts(
  departmentId: string,
  data: SetDepartmentProductsRequest
) {
  try {
    // Validate input
    const validatedData = SetDepartmentProductsRequestSchema.parse(data);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/departments/${departmentId}/products`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to set department products: ${response.statusText}`
      );
    }

    const responseData = await response.json();
    return SetDepartmentProductsResponseSchema.parse(responseData);
  } catch (error) {
    console.error("Error setting department products:", error);
    throw error;
  }
}


