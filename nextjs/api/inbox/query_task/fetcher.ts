import { QueryTaskResponse } from './model';
import { fetchWithToken } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function queryTask(taskId: string): Promise<QueryTaskResponse> {
  const url = `${API_BASE_URL}/api/inbox/tasks/${taskId}`;

  const response = await fetchWithToken(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch task: ${response.status}`);
  }

  return response.json();
}

