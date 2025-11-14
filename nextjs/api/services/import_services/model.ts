import { z } from "zod";

export const ImportServicesResponseSchema = z.object({
  success_count: z.number(),
  failed_count: z.number(),
  errors: z.array(z.string()),
});

export type ImportServicesResponse = z.infer<typeof ImportServicesResponseSchema>;

