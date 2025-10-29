import { z } from "zod";

export const QueryUserResponseSchema = z.object({
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

export type QueryUserResponse = z.infer<typeof QueryUserResponseSchema>;

