import { QueryTasksParams, QueryTasksResponse } from './model';
import { fetchWithToken } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function queryTasks(params?: QueryTasksParams): Promise<QueryTasksResponse> {
  const { status, search, page = 1, limit = 20 } = params || {};
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  if (search) queryParams.append('search', search);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  
  const url = `${API_BASE_URL}/api/inbox/tasks?${queryParams.toString()}`;
  
  console.log('[Inbox queryTasks] Request params:', { status, search, page, limit });
  console.log('[Inbox queryTasks] Request URL:', url);

  const response = await fetchWithToken(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Inbox queryTasks] Response:', data);
  
  return data;
}

