'use server';

import { completeTask } from './fetcher';

export async function completeTaskAction(taskId: string, productIdsToRemove?: string[]): Promise<void> {
  return completeTask(taskId, productIdsToRemove);
}






