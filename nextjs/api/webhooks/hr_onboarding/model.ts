import { z } from "zod";

// Request schema for HR onboarding webhook
export const HrOnboardingRequestSchema = z.object({
  employee: z.object({
    name: z.string(),
    email: z.string().email(),
    department: z.string().optional(),
    position: z.string().optional(),
    hireDate: z.string().optional(), // YYYY-MM-DD format
  }),
});

export type HrOnboardingRequest = z.infer<typeof HrOnboardingRequestSchema>;

// Response schema
export const HrOnboardingResponseSchema = z.object({
  task_id: z.string().uuid(),
  message: z.string(),
});

export type HrOnboardingResponse = z.infer<typeof HrOnboardingResponseSchema>;

