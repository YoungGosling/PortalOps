import { z } from "zod";

export const ProductStatusSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const QueryProductStatusesResponseSchema = z.array(ProductStatusSchema);

export type ProductStatus = z.infer<typeof ProductStatusSchema>;
export type QueryProductStatusesResponse = z.infer<typeof QueryProductStatusesResponseSchema>;






