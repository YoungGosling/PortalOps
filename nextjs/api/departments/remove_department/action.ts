"use server";

import { deleteDepartment } from "./fetcher";

async function deleteDepartmentAction(departmentId: string) {
  return await deleteDepartment(departmentId);
}

export { deleteDepartmentAction };






