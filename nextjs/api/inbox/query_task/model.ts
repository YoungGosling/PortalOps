import { WorkflowTask } from '@/types';

// Path parameter
export interface QueryTaskParams {
  task_id: string;
}

// Response type
export type QueryTaskResponse = WorkflowTask;


