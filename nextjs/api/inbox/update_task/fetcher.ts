import { UpdateTaskRequest } from './model';
import { fetchWithToken } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function updateTask(taskId: string, data: UpdateTaskRequest): Promise<void> {
  const url = `${API_BASE_URL}/api/inbox/tasks/${taskId}`;

  const response = await fetchWithToken(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.status}`);
  }

  // 204 No Content response
  return;
}

