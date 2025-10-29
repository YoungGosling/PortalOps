import { z } from "zod";

export const CreateProductRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  statusId: z.number().optional(),
});

export const CreateProductResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  service_id: z.string(),
  service_name: z.string().optional(),
  status_id: z.number().optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>;

