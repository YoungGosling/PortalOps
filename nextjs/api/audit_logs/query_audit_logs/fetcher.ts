import { AuditLogsResponseSchema, type QueryAuditLogsParams } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchAuditLogs(params: QueryAuditLogsParams = {}) {
  try {
    const {
      actor_user_id,
      action,
      page = 1,
      limit = 20,
    } = params;

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    
    if (actor_user_id) {
      queryParams.append("actor_user_id", actor_user_id);
    }
    
    if (action) {
      queryParams.append("action", action);
    }

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/audit-logs?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    }

    const data = await response.json();
    return AuditLogsResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    // Return empty results instead of null to prevent UI crashes
    return {
      data: [],
      pagination: {
        total: 0,
        page: params.page || 1,
        limit: params.limit || 20,
      },
    };
  }
}

