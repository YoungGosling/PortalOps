"use server";

import { importServices } from "./fetcher";
import type { ImportServicesResponse } from "./model";

export async function importServicesAction(file: File): Promise<ImportServicesResponse> {
  try {
    return await importServices(file);
  } catch (error) {
    // Re-throw with a more descriptive error message for Server Components
    if (error instanceof Error) {
      throw new Error(`Failed to import services: ${error.message}`);
    }
    throw new Error("Failed to import services: Unknown error occurred");
  }
}

