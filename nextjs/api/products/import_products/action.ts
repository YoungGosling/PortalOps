'use server';

import { importProducts } from './fetcher';
import { ImportProductsResponse } from './model';

export async function importProductsAction(file: File): Promise<ImportProductsResponse> {
  return importProducts(file);
}


