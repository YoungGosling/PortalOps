"use server";

import { fetchDashboardStats } from "./fetcher";

async function fetchDashboardStatsAction() {
  return await fetchDashboardStats();
}

export { fetchDashboardStatsAction };

