import { z } from "zod";

export const UpdatePaymentMethodRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const UpdatePaymentMethodResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UpdatePaymentMethodRequest = z.infer<typeof UpdatePaymentMethodRequestSchema>;
export type UpdatePaymentMethodResponse = z.infer<typeof UpdatePaymentMethodResponseSchema>;

