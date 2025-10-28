import { z } from "zod";

export const HealthCheckSchema = z.object({
  status: z.string(),
  timestamp: z.string().optional(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

