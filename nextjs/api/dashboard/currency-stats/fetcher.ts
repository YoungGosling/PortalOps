import { CurrencyStatsSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchCurrencyStats(
  currencyCode: string,
  startDate?: string,
  endDate?: string
) {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      currency_code: currencyCode,
    });
    
    if (startDate) {
      params.append('start_date', startDate);
    }
    
    if (endDate) {
      params.append('end_date', endDate);
    }

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/currency-stats?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch currency stats: ${response.statusText}`);
    }

    const data = await response.json();
    return CurrencyStatsSchema.parse(data);
  } catch (error) {
    console.error("Error fetching currency stats:", error);
    return {
      totalAmount: 0,
      currencyCode: currencyCode,
      currencySymbol: null,
    };
  }
}

