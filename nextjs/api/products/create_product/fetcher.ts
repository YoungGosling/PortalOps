import { ProductCreateWithUrlSchema, ProductSchema } from "./model";
import { fetchWithToken } from "@/lib/utils";

export async function createProduct(data: {
  name: string;
  url?: string | null;
  description?: string | null;
  serviceId: string;
  statusId?: number | null;
  adminUserIds?: string[];
}) {
  try {
    const validatedData = ProductCreateWithUrlSchema.parse(data);
    
    const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create product: ${response.statusText}`);
    }

    const responseData = await response.json();
    return ProductSchema.parse(responseData);
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

