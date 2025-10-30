import { HrOffboardingRequestSchema, type HrOffboardingRequest } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function triggerHrOffboarding(
  data: HrOffboardingRequest,
  apiKey?: string
) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add API key if provided (for webhook authentication)
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/webhooks/hr/offboarding`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to trigger HR offboarding: ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error triggering HR offboarding:", error);
    throw error;
  }
}


