"use server";

import { importServices } from "./fetcher";
import type { ImportServicesResponse } from "./model";

export async function importServicesAction(file: File): Promise<ImportServicesResponse> {
  return await importServices(file);
}

