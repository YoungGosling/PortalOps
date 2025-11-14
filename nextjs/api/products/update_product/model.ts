import { z } from "zod";

export const ProductUpdateWithUrlSchema = z.object({
  name: z.string(),
  url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  serviceId: z.string().uuid(),
  statusId: z.number().int().nullable().optional(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  service_id: z.string().uuid().nullable(),
  service_name: z.string().nullable().optional(),
  status_id: z.number().int().optional(),
  status: z.string().optional(),
  latest_payment_date: z.string().nullable().optional(),
  latest_usage_start_date: z.string().nullable().optional(),
  latest_usage_end_date: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ProductUpdateWithUrl = z.infer<typeof ProductUpdateWithUrlSchema>;
export type Product = z.infer<typeof ProductSchema>;

