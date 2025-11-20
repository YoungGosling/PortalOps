import { QueryCurrenciesResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchQueryCurrencies() {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/currencies`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch currencies: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryCurrenciesResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return [];
  }
}


