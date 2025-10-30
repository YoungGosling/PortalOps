"use server";

import { setDepartmentProducts } from "./fetcher";
import type { SetDepartmentProductsRequest } from "./model";

async function setDepartmentProductsAction(
  departmentId: string,
  data: SetDepartmentProductsRequest
) {
  return await setDepartmentProducts(departmentId, data);
}

export { setDepartmentProductsAction };


