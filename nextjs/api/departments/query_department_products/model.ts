import { z } from "zod";

// Product schema matching backend Product response
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  service_id: z.string().uuid().nullable(),
  service_name: z.string().nullable().optional(),
  status_id: z.number().optional(),
  status: z.string().nullable().optional(),
  latest_payment_date: z.string().nullable().optional(),
  latest_usage_start_date: z.string().nullable().optional(),
  latest_usage_end_date: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// Response schema for list of products
export const DepartmentProductsResponseSchema = z.array(ProductSchema);

export type DepartmentProductsResponse = z.infer<typeof DepartmentProductsResponseSchema>;

