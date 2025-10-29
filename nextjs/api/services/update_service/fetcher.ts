import { UpdateServiceRequestSchema, UpdateServiceResponseSchema, UpdateServiceRequest } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchUpdateService(serviceId: string, data: UpdateServiceRequest) {
  try {
    // Validate input
    const validatedData = UpdateServiceRequestSchema.parse(data);
    
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services/${serviceId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update service: ${response.statusText}`);
    }

    const responseData = await response.json();
    return UpdateServiceResponseSchema.parse(responseData);
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
}

