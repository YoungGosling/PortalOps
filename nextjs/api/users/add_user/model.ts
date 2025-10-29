import { z } from "zod";

export const AddUserRequestSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  department: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  resignation_date: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  assignedProductIds: z.array(z.string()).optional(),
});

export const AddUserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  department: z.string().nullable(),
  department_id: z.string().nullable(),
  position: z.string().nullable(),
  hire_date: z.string().nullable(),
  resignation_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AddUserRequest = z.infer<typeof AddUserRequestSchema>;
export type AddUserResponse = z.infer<typeof AddUserResponseSchema>;

