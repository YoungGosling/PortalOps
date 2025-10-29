import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  service_id: z.string().uuid(),
  service_name: z.string().optional(),
  status_id: z.number().int().optional(),
  status: z.string().optional(),
  latest_payment_date: z.string().nullable().optional(),
  latest_usage_start_date: z.string().nullable().optional(),
  latest_usage_end_date: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const QueryProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export type Product = z.infer<typeof ProductSchema>;
export type QueryProductsResponse = z.infer<typeof QueryProductsResponseSchema>;

