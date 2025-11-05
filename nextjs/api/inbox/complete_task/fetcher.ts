import { fetchWithToken } from '@/lib/utils';
import type { CompleteTaskRequest } from './model';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function completeTask(taskId: string, productIdsToRemove?: string[]): Promise<void> {
  const url = `${API_BASE_URL}/api/inbox/tasks/${taskId}/complete`;

  const body: CompleteTaskRequest = {};
  if (productIdsToRemove && productIdsToRemove.length > 0) {
    body.product_ids_to_remove = productIdsToRemove;
  }

  const response = await fetchWithToken(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed to complete task: ${response.status}`);
  }

  // 204 No Content response
  return;
}

