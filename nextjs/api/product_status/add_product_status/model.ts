import { z } from "zod";

export const AddProductStatusRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const AddProductStatusResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AddProductStatusRequest = z.infer<typeof AddProductStatusRequestSchema>;
export type AddProductStatusResponse = z.infer<typeof AddProductStatusResponseSchema>;


