"use server";

import { fetchListAttachments } from "./fetcher";

async function fetchListAttachmentsAction() {
  return await fetchListAttachments();
}

export { fetchListAttachmentsAction };






