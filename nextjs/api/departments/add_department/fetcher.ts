import { DepartmentCreateRequestSchema, DepartmentResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";
import type { DepartmentCreateRequest } from "./model";

/**
 * Create a new department
 * POST /api/departments
 */
export async function createDepartment(data: DepartmentCreateRequest) {
  try {
    // Validate input
    const validatedData = DepartmentCreateRequestSchema.parse(data);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/departments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create department: ${response.statusText}`);
    }

    const responseData = await response.json();
    return DepartmentResponseSchema.parse(responseData);
  } catch (error) {
    console.error("Error creating department:", error);
    throw error;
  }
}

