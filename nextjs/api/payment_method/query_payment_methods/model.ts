import { z } from "zod";

export const PaymentMethodSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const QueryPaymentMethodsResponseSchema = z.array(PaymentMethodSchema);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type QueryPaymentMethodsResponse = z.infer<typeof QueryPaymentMethodsResponseSchema>;


