"use server";

import { fetchPendingTasksCount } from "./fetcher";

async function fetchPendingTasksCountAction() {
  return await fetchPendingTasksCount();
}

export { fetchPendingTasksCountAction };

