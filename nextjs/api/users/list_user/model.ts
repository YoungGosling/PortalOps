import { z } from "zod";

export const UserItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  department: z.string().nullable(),
  department_id: z.string().nullable(),
  position: z.string().nullable(),
  hire_date: z.string().nullable(),
  resignation_date: z.string().nullable(),
  roles: z.array(z.string()),
  assignedProductIds: z.array(z.string()),
  sap_ids: z.array(z.string()).optional(),
});

export const PaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const ListUserResponseSchema = z.object({
  data: z.array(UserItemSchema),
  pagination: PaginationSchema,
});

export type UserItem = z.infer<typeof UserItemSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ListUserResponse = z.infer<typeof ListUserResponseSchema>;

