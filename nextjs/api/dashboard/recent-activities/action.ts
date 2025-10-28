"use server";

import { fetchRecentActivities } from "./fetcher";

async function fetchRecentActivitiesAction(limit: number = 10) {
  return await fetchRecentActivities(limit);
}

export { fetchRecentActivitiesAction };

