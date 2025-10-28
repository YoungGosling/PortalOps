import { HealthCheckSchema } from "./model";

export async function fetchHealthCheck() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    const data = await response.json();
    return HealthCheckSchema.parse(data);
  } catch (error) {
    console.error("Error during health check:", error);
    return {
      status: "error",
      timestamp: new Date().toISOString(),
    };
  }
}

