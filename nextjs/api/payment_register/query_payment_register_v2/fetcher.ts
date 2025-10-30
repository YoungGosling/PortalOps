import { QueryPaymentRegisterV2ResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function queryPaymentRegisterV2(
  page: number = 1,
  limit: number = 20
) {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/payment-register?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to query payment register v2: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryPaymentRegisterV2ResponseSchema.parse(data);
  } catch (error) {
    console.error("Error querying payment register v2:", error);
    return {
      data: [],
      pagination: {
        total: 0,
        page: page,
        limit: limit,
      },
    };
  }
}


