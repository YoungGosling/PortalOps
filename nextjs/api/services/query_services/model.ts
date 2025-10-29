import { z } from "zod";

export const ProductSimpleSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().optional(),
});

export const AdminSimpleSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string().optional().nullable(),
  productCount: z.number().optional().default(0),
  products: z.array(ProductSimpleSchema).optional(),
  admins: z.array(AdminSimpleSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const PaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const QueryServicesResponseSchema = z.object({
  data: z.array(ServiceSchema),
  pagination: PaginationSchema,
});

export type Service = z.infer<typeof ServiceSchema>;
export type QueryServicesResponse = z.infer<typeof QueryServicesResponseSchema>;

