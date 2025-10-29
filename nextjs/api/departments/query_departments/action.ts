"use server";

import { fetchDepartments } from "./fetcher";

async function fetchDepartmentsAction() {
  return await fetchDepartments();
}

export { fetchDepartmentsAction };

