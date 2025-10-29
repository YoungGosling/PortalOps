'use server';

import { queryTask } from './fetcher';
import { QueryTaskResponse } from './model';

export async function queryTaskAction(taskId: string): Promise<QueryTaskResponse> {
  return queryTask(taskId);
}

