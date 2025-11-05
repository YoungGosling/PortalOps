"use server";

import { fetchApplicationsQuery } from "./fetcher";

async function fetchApplicationsQueryAction(
  tenant_domain: string,
  username: string,
  page: number = 1,
  page_size: number = 10,
) {
  return await fetchApplicationsQuery(
    tenant_domain,
    username,
    page,
    page_size
  )
}
export {
  fetchApplicationsQueryAction
}