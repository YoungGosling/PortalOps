"use server";

import { fetchDepartmentProducts } from "./fetcher";

async function fetchDepartmentProductsAction(departmentId: string) {
  return await fetchDepartmentProducts(departmentId);
}

export { fetchDepartmentProductsAction };

