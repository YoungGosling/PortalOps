import { fetchWithToken } from "@/lib/utils";

export async function fetchDeleteService(serviceId: string) {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services/${serviceId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete service: ${response.statusText}`);
    }

    // DELETE typically returns 204 No Content
    if (response.status === 204) {
      return { success: true, message: "Service deleted successfully" };
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
}

