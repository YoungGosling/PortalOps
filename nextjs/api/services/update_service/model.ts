import { z } from "zod";

export const UpdateServiceRequestSchema = z.object({
  name: z.string().optional(),
  vendor: z.string().optional(),
  associateProductIds: z.array(z.string()).optional(),
  disassociateProductIds: z.array(z.string()).optional(),
  adminUserIds: z.array(z.string()).optional(),
});

export const UpdateServiceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string().optional().nullable(),
  productCount: z.number().optional().default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type UpdateServiceRequest = z.infer<typeof UpdateServiceRequestSchema>;
export type UpdateServiceResponse = z.infer<typeof UpdateServiceResponseSchema>;

