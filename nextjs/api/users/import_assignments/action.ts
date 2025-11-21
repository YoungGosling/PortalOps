"use server";

import { importAssignments } from "./fetcher";
import type { ImportAssignmentsResponse } from "./model";

export async function importAssignmentsAction(file: File): Promise<ImportAssignmentsResponse> {
  try {
    return await importAssignments(file);
  } catch (error) {
    // Re-throw with a more descriptive error message for Server Components
    if (error instanceof Error) {
      throw new Error(`Failed to import product assignments: ${error.message}`);
    }
    throw new Error("Failed to import product assignments: Unknown error occurred");
  }
}

