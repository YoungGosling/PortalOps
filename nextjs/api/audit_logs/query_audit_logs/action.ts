"use server";

import { fetchAuditLogs } from "./fetcher";
import type { QueryAuditLogsParams } from "./model";

async function fetchAuditLogsAction(params: QueryAuditLogsParams = {}) {
  return await fetchAuditLogs(params);
}

export { fetchAuditLogsAction };

