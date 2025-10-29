"use server";

import { fetchDownloadAttachment } from "./fetcher";

async function fetchDownloadAttachmentAction(fileId: string) {
  return await fetchDownloadAttachment(fileId);
}

export { fetchDownloadAttachmentAction };

