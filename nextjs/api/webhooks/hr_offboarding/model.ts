import { z } from "zod";

// Request schema for HR offboarding webhook
export const HrOffboardingRequestSchema = z.object({
  employee: z.object({
    name: z.string(),
    email: z.string().email(),
    resignationDate: z.string().optional(), // YYYY-MM-DD format
  }),
});

export type HrOffboardingRequest = z.infer<typeof HrOffboardingRequestSchema>;

// Response schema
export const HrOffboardingResponseSchema = z.object({
  task_id: z.string().uuid(),
  message: z.string(),
});

export type HrOffboardingResponse = z.infer<typeof HrOffboardingResponseSchema>;


