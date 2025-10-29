import { z } from "zod";

export const RemoveProductStatusParamsSchema = z.object({
  status_id: z.number(),
});

export type RemoveProductStatusParams = z.infer<typeof RemoveProductStatusParamsSchema>;

