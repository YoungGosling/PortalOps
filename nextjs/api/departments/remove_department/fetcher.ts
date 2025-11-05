import { fetchWithToken } from "@/lib/utils";

/**
 * Delete a department
 * DELETE /api/departments/{department_id}
 */
export async function deleteDepartment(departmentId: string) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/departments/${departmentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete department: ${response.statusText}`);
    }

    // DELETE returns 204 No Content
    return;
  } catch (error) {
    console.error("Error deleting department:", error);
    throw error;
  }
}






