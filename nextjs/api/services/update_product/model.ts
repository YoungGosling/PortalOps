import { z } from "zod";

export const UpdateProductRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  serviceId: z.string().optional(),
  statusId: z.number().optional(),
});

export const UpdateProductResponseSchema = z.object({
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

export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;
export type UpdateProductResponse = z.infer<typeof UpdateProductResponseSchema>;

