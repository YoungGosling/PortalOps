import { z } from "zod";

export const UpdatePaymentInfoRequestSchema = z.object({
  amount: z.string().nullable().optional(),
  cardholder_name: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  payment_method_id: z.number().int().nullable().optional(),
  payment_date: z.string().nullable().optional(),
  usage_start_date: z.string().nullable().optional(),
  usage_end_date: z.string().nullable().optional(),
  reporter: z.string().nullable().optional(),
  bill_attachment: z.instanceof(File).nullable().optional(),
});

export type UpdatePaymentInfoRequest = z.infer<typeof UpdatePaymentInfoRequestSchema>;

