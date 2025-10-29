import { z } from "zod";

export const UpdatePaymentByIdRequestSchema = z.object({
  amount: z.string().optional(),
  cardholder_name: z.string().optional(),
  expiry_date: z.string().optional(),
  payment_method_id: z.number().int().optional(),
  payment_date: z.string().optional(),
  usage_start_date: z.string().optional(),
  usage_end_date: z.string().optional(),
  reporter: z.string().optional(),
});

export type UpdatePaymentByIdRequest = z.infer<typeof UpdatePaymentByIdRequestSchema>;

