import { UploadAttachmentResponse } from './model';
import { fetchWithToken } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function uploadAttachment(
  taskId: string,
  file: File
): Promise<UploadAttachmentResponse> {
  const url = `${API_BASE_URL}/api/inbox/tasks/${taskId}/attachment`;

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithToken(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload attachment: ${response.status}`);
  }

  return response.json();
}

