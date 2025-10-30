"use server";

import { createDepartment } from "./fetcher";
import type { DepartmentCreateRequest } from "./model";

async function createDepartmentAction(data: DepartmentCreateRequest) {
  return await createDepartment(data);
}

export { createDepartmentAction };


