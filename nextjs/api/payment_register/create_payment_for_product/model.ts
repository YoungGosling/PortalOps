import { z } from "zod";

export const CreatePaymentForProductRequestSchema = z.object({
  amount: z.string().optional(),
  cardholder_name: z.string().optional(),
  expiry_date: z.string().optional(),
  payment_method_id: z.number().int().optional(),
  payment_date: z.string(),
  usage_start_date: z.string(),
  usage_end_date: z.string(),
  reporter: z.string().optional(),
});

export const CreatePaymentForProductResponseSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  status: z.string(),
});

export type CreatePaymentForProductRequest = z.infer<typeof CreatePaymentForProductRequestSchema>;
export type CreatePaymentForProductResponse = z.infer<typeof CreatePaymentForProductResponseSchema>;

