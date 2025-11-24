import { z } from "zod";

// Department schema matching backend response
export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  users: z.array(z.string()).optional(), // List of user names in this department
});

export type Department = z.infer<typeof DepartmentSchema>;

// Response schema for list of departments
export const DepartmentsResponseSchema = z.array(DepartmentSchema);

export type DepartmentsResponse = z.infer<typeof DepartmentsResponseSchema>;

