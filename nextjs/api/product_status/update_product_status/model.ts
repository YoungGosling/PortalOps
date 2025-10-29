import { z } from "zod";

export const UpdateProductStatusRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const UpdateProductStatusResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UpdateProductStatusRequest = z.infer<typeof UpdateProductStatusRequestSchema>;
export type UpdateProductStatusResponse = z.infer<typeof UpdateProductStatusResponseSchema>;

