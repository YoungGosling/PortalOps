import { DepartmentUpdateRequestSchema, DepartmentResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";
import type { DepartmentUpdateRequest } from "./model";

/**
 * Update a department
 * PUT /api/departments/{department_id}
 */
export async function updateDepartment(
  departmentId: string,
  data: DepartmentUpdateRequest
) {
  try {
    // Validate input
    const validatedData = DepartmentUpdateRequestSchema.parse(data);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/departments/${departmentId}`,
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
      throw new Error(errorData.message || `Failed to update department: ${response.statusText}`);
    }

    const responseData = await response.json();
    return DepartmentResponseSchema.parse(responseData);
  } catch (error) {
    console.error("Error updating department:", error);
    throw error;
  }
}


