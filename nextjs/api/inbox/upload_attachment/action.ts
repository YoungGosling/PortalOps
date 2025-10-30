'use server';

import { uploadAttachment } from './fetcher';
import { UploadAttachmentResponse } from './model';

export async function uploadAttachmentAction(
  taskId: string,
  file: File
): Promise<UploadAttachmentResponse> {
  return uploadAttachment(taskId, file);
}


