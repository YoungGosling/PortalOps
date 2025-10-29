import { WorkflowTask } from '@/types';

// Query parameters
export interface QueryTasksParams {
  status?: string;
  page?: number;
  limit?: number;
}

// Response type
export interface QueryTasksResponse {
  data: WorkflowTask[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

