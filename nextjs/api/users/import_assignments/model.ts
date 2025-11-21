import { z } from "zod";

export const ImportAssignmentsResponseSchema = z.object({
  success_count: z.number(),
  failed_count: z.number(),
  errors: z.array(z.string()),
});

export type ImportAssignmentsResponse = z.infer<typeof ImportAssignmentsResponseSchema>;

