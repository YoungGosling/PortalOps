import { ImportProductsResponseSchema, ImportProductsResponse } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function importProducts(file: File): Promise<ImportProductsResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/import`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      // Try to parse JSON error response from FastAPI
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        // FastAPI returns errors in format: {"detail": "error message"}
        errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch {
        // If not JSON, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || response.statusText;
        } catch {
          // Fallback to status text
          errorMessage = response.statusText;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return ImportProductsResponseSchema.parse(data);
  } catch (error) {
    console.error("Error importing products:", error);
    throw error;
  }
}

