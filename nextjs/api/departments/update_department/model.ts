import { z } from "zod";

// Department update request schema
export const DepartmentUpdateRequestSchema = z.object({
  name: z.string().min(1, "Department name is required"),
});

export type DepartmentUpdateRequest = z.infer<typeof DepartmentUpdateRequestSchema>;

// Department response schema
export const DepartmentResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type DepartmentResponse = z.infer<typeof DepartmentResponseSchema>;

