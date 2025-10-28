import { z } from "zod";

export const PendingTasksCountSchema = z.object({
  pending_count: z.number(),
});

export type PendingTasksCount = z.infer<typeof PendingTasksCountSchema>;

