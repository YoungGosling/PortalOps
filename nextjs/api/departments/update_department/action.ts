"use server";

import { updateDepartment } from "./fetcher";
import type { DepartmentUpdateRequest } from "./model";

async function updateDepartmentAction(
  departmentId: string,
  data: DepartmentUpdateRequest
) {
  return await updateDepartment(departmentId, data);
}

export { updateDepartmentAction };

