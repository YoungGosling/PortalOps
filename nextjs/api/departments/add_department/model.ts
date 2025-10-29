import { z } from "zod";

// Department create request schema
export const DepartmentCreateRequestSchema = z.object({
  name: z.string().min(1, "Department name is required"),
});

export type DepartmentCreateRequest = z.infer<typeof DepartmentCreateRequestSchema>;

// Department response schema
export const DepartmentResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type DepartmentResponse = z.infer<typeof DepartmentResponseSchema>;

