import { z } from "zod";

export const PaymentInfoSchema = z.object({
  status: z.string().default("incomplete"),
  amount: z.string().nullable().optional(),
  cardholderName: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  paymentMethodId: z.number().int().nullable().optional(),
  paymentDate: z.string().nullable().optional(),
  usageStartDate: z.string().nullable().optional(),
  usageEndDate: z.string().nullable().optional(),
  reporter: z.string().nullable().optional(),
  billAttachmentPath: z.string().nullable().optional(),
  invoices: z.array(z.object({
    id: z.string().uuid(),
    original_file_name: z.string(),
    url: z.string(),
  })).nullable().optional(),
});

export const PaymentRegisterItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  serviceName: z.string(),
  paymentInfo: PaymentInfoSchema,
});

export const QueryPaymentRegisterResponseSchema = z.array(PaymentRegisterItemSchema);

export type PaymentInfo = z.infer<typeof PaymentInfoSchema>;
export type PaymentRegisterItem = z.infer<typeof PaymentRegisterItemSchema>;
export type QueryPaymentRegisterResponse = z.infer<typeof QueryPaymentRegisterResponseSchema>;


