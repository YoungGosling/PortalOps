'use server';

import { downloadAttachment } from './fetcher';

export async function downloadAttachmentAction(taskId: string): Promise<Blob> {
  return downloadAttachment(taskId);
}


