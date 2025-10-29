import { z } from "zod";

export const QueryProductResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  service_id: z.string(),
  service_name: z.string().optional(),
  status_id: z.number().optional(),
  status: z.string().optional(),
  latest_payment_date: z.string().optional(),
  latest_usage_start_date: z.string().optional(),
  latest_usage_end_date: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type QueryProductResponse = z.infer<typeof QueryProductResponseSchema>;

