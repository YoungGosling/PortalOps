import { ImportServicesResponseSchema, ImportServicesResponse } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function importServices(file: File): Promise<ImportServicesResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services/import`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to import services: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return ImportServicesResponseSchema.parse(data);
  } catch (error) {
    console.error("Error importing services:", error);
    throw error;
  }
}

