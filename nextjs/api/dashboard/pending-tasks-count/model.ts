import { z } from "zod";

export const PendingTasksCountSchema = z.object({
  pendingCount: z.number(),
});

export type PendingTasksCount = z.infer<typeof PendingTasksCountSchema>;


