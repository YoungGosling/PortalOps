import { z } from "zod";

export const UpdatePaymentInfoV2RequestSchema = z.object({
  amount: z.string().optional(),
  cardholder_name: z.string().optional(),
  expiry_date: z.string().optional(),
  payment_method_id: z.number().int().optional(),
  payment_date: z.string().optional(),
  usage_start_date: z.string().optional(),
  usage_end_date: z.string().optional(),
  reporter: z.string().optional(),
});

export type UpdatePaymentInfoV2Request = z.infer<typeof UpdatePaymentInfoV2RequestSchema>;


