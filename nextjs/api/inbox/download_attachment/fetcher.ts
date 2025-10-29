import { fetchWithToken } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function downloadAttachment(taskId: string): Promise<Blob> {
  const url = `${API_BASE_URL}/api/inbox/tasks/${taskId}/attachment`;

  const response = await fetchWithToken(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to download attachment: ${response.status}`);
  }

  return response.blob();
}

