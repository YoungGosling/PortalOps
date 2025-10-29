'use server';

import { queryTasks } from './fetcher';
import { QueryTasksParams, QueryTasksResponse } from './model';

export async function queryTasksAction(
  params?: QueryTasksParams
): Promise<QueryTasksResponse> {
  return queryTasks(params);
}

