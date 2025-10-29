import { CreateServiceRequestSchema, CreateServiceResponseSchema, CreateServiceRequest } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchCreateService(data: CreateServiceRequest) {
  try {
    // Validate input
    const validatedData = CreateServiceRequestSchema.parse(data);
    
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create service: ${response.statusText}`);
    }

    const responseData = await response.json();
    return CreateServiceResponseSchema.parse(responseData);
  } catch (error) {
    console.error("Error creating service:", error);
    throw error;
  }
}

