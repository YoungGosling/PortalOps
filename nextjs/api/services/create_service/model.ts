import { z } from "zod";

export const CreateServiceRequestSchema = z.object({
  name: z.string(),
  vendor: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  adminUserIds: z.array(z.string()).optional(),
});

export const CreateServiceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string().optional().nullable(),
  productCount: z.number().optional().default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CreateServiceRequest = z.infer<typeof CreateServiceRequestSchema>;
export type CreateServiceResponse = z.infer<typeof CreateServiceResponseSchema>;

