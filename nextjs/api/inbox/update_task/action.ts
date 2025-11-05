'use server';

import { updateTask } from './fetcher';
import { UpdateTaskRequest } from './model';

export async function updateTaskAction(
  taskId: string,
  data: UpdateTaskRequest
): Promise<void> {
  return updateTask(taskId, data);
}






