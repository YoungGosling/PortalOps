import { QueryTasksParams, QueryTasksResponse } from './model';
import { fetchWithToken } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function queryTasks(params?: QueryTasksParams): Promise<QueryTasksResponse> {
  const { status, page = 1, limit = 20 } = params || {};
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  
  const url = `${API_BASE_URL}/api/inbox/tasks?${queryParams.toString()}`;

  const response = await fetchWithToken(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.status}`);
  }

  return response.json();
}

