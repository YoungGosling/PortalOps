import { DashboardStatsSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchDashboardStats() {
  try {
    const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
    }

    const data = await response.json();
    return DashboardStatsSchema.parse(data);
  } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      console.log('error打印:',error);
    return {
      totalServices: 0,
      totalProducts: 0,
      totalUsers: 0,
      totalAmount: 0,
      incompletePayments: 0,
    };
  }
}

