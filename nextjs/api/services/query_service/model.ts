import { z } from "zod";

export const ProductSimpleSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().optional(),
});

export const QueryServiceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string().optional(),
  products: z.array(ProductSimpleSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type QueryServiceResponse = z.infer<typeof QueryServiceResponseSchema>;

