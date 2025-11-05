import { ApplicationWithEnrollmentResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchApplicationsQuery(
  tenant_domain: string,
  username: string,
  page: number = 1,
  page_size: number = 10,
) {
  try {
    const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/users/applications/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page: page,
        page_size: page_size,
        tenant_domain: tenant_domain,
        username: username,
      }),
    });

    if (!response.ok) {
      // If user doesn't exist (404), return empty results instead of throwing
      if (response.status === 404) {
        console.warn(`User ${username}@${tenant_domain} not found, returning empty applications`);
        return {
          applications: [],
          total_count: 0,
          page: page,
          page_size: page_size,
        };
      }
      throw new Error(`Failed to fetch applications: ${response.statusText}`);
    }
    
    const data = await response.json();
    return ApplicationWithEnrollmentResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching applications:", error);
    // Return empty results instead of null to prevent UI crashes
    return {
      applications: [],
      total_count: 0,
      page: page,
      page_size: page_size,
    };
  }
}