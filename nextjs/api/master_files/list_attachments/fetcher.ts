import { ListAttachmentsResponseSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function fetchListAttachments() {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/master-files/attachments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch attachments: ${response.statusText}`);
    }

    const data = await response.json();
    return ListAttachmentsResponseSchema.parse(data);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return [];
  }
}


