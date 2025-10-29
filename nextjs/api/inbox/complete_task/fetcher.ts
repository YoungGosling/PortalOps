import { fetchWithToken } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function completeTask(taskId: string): Promise<void> {
  const url = `${API_BASE_URL}/api/inbox/tasks/${taskId}/complete`;

  const response = await fetchWithToken(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to complete task: ${response.status}`);
  }

  // 204 No Content response
  return;
}

