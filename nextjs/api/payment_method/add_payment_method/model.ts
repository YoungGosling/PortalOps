import { z } from "zod";

export const AddPaymentMethodRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const AddPaymentMethodResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AddPaymentMethodRequest = z.infer<typeof AddPaymentMethodRequestSchema>;
export type AddPaymentMethodResponse = z.infer<typeof AddPaymentMethodResponseSchema>;

