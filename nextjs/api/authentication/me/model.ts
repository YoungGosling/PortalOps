import { z } from "zod";

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  department: z.string().nullish(),
  department_id: z.string().uuid().nullish(),
  position: z.string().nullish(),
  hire_date: z.string().nullish(),
  resignation_date: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  roles: z.array(z.string()).optional(),
  assigned_services: z.array(z.object({
    service_id: z.string().uuid(),
    service_name: z.string(),
    products: z.array(z.object({
      product_id: z.string().uuid(),
      product_name: z.string(),
    })),
  })).optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

