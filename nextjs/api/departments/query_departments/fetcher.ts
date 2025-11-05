import { DepartmentsResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

/**
 * Fetch all departments
 * GET /api/departments
 */
export async function fetchDepartments() {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/departments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.statusText}`);
    }

    const data = await response.json();
    return DepartmentsResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
}






