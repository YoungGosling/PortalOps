import { z } from "zod";

// Request schema for setting department product assignments
export const SetDepartmentProductsRequestSchema = z.object({
  product_ids: z.array(z.string().uuid()),
});

export type SetDepartmentProductsRequest = z.infer<typeof SetDepartmentProductsRequestSchema>;

// Response schema after setting department product assignments
export const SetDepartmentProductsResponseSchema = z.object({
  assigned_product_ids: z.array(z.string()),
});

export type SetDepartmentProductsResponse = z.infer<typeof SetDepartmentProductsResponseSchema>;

