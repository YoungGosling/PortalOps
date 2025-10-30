import { QueryPaymentRegisterResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function queryPaymentRegister() {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payment-register`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to query payment register: ${response.statusText}`);
    }

    const data = await response.json();
    return QueryPaymentRegisterResponseSchema.parse(data);
  } catch (error) {
    console.error("Error querying payment register:", error);
    return [];
  }
}


