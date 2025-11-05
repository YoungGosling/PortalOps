'use server';

import { deleteTask } from './fetcher';

export async function deleteTaskAction(taskId: string): Promise<void> {
  return deleteTask(taskId);
}






