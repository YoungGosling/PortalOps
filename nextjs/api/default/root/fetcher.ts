import { RootInfoSchema } from "./model";

export async function fetchRootInfo() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch root info: ${response.statusText}`);
    }

    const data = await response.json();
    return RootInfoSchema.parse(data);
  } catch (error) {
    console.error("Error fetching root info:", error);
    return {
      message: "PortalOps API",
      version: "1.0.0",
    };
  }
}

