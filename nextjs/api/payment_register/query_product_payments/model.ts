import { z } from "zod";

export const PaymentInfoItemSchema = z.object({
  paymentId: z.string().uuid(),
  paymentInfo: z.object({
    id: z.string().uuid().optional(),
    status: z.string().default("incomplete"),
    amount: z.string().nullable().optional(),
    cardholderName: z.string().nullable().optional(),
    expiryDate: z.string().nullable().optional(),
    paymentMethod: z.string().nullable().optional(),
    paymentMethodId: z.number().int().nullable().optional(),
    paymentMethodDescription: z.string().nullable().optional(),
    paymentDate: z.string().nullable().optional(),
    usageStartDate: z.string().nullable().optional(),
    usageEndDate: z.string().nullable().optional(),
    reporter: z.string().nullable().optional(),
    invoices: z.array(z.object({
      id: z.string().uuid(),
      original_file_name: z.string(),
      url: z.string(),
    })).nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
  productId: z.string().uuid(),
  productName: z.string(),
  productDescription: z.string().nullable().optional(),
  serviceName: z.string(),
  serviceVendor: z.string().nullable().optional(),
  productStatus: z.string().nullable().optional(),
});

export const QueryProductPaymentsResponseSchema = z.array(PaymentInfoItemSchema);

export type PaymentInfoItem = z.infer<typeof PaymentInfoItemSchema>;
export type QueryProductPaymentsResponse = z.infer<typeof QueryProductPaymentsResponseSchema>;

