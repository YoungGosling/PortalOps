import { HrOnboardingRequestSchema, type HrOnboardingRequest } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function triggerHrOnboarding(
  data: HrOnboardingRequest,
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
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/webhooks/hr/onboarding`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to trigger HR onboarding: ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error triggering HR onboarding:", error);
    throw error;
  }
}

