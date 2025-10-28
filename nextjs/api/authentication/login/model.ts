import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  department: z.string().nullable(),
  department_id: z.string().uuid().nullable(),
  position: z.string().nullable(),
  hire_date: z.string().nullable(),
  resignation_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TokenSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    roles: z.array(z.string()).optional(),
  }),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type User = z.infer<typeof UserSchema>;

