import { z } from "zod";

export const PaymentInfoV2Schema = z.object({
  id: z.string().uuid().optional(),
  status: z.string().default("incomplete"),
  amount: z.number().nullable().optional(),
  cardholderName: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  paymentMethodId: z.number().int().nullable().optional(),
  paymentMethodDescription: z.string().nullable().optional(),
  currencyId: z.number().int().nullable().optional(),
  currencyCode: z.string().nullable().optional(),
  currencySymbol: z.string().nullable().optional(),
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
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const PaymentRegisterItemV2Schema = z.object({
  productId: z.string().uuid().nullable(),
  productName: z.string().nullable(),
  productDescription: z.string().nullable().optional(),
  serviceName: z.string().nullable(),
  serviceVendor: z.string().nullable().optional(),
  productStatus: z.string().nullable().optional(),
  paymentInfo: PaymentInfoV2Schema,
});

export const PaginationSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export const QueryPaymentRegisterV2ResponseSchema = z.object({
  data: z.array(PaymentRegisterItemV2Schema),
  pagination: PaginationSchema,
});

export type PaymentInfoV2 = z.infer<typeof PaymentInfoV2Schema>;
export type PaymentRegisterItemV2 = z.infer<typeof PaymentRegisterItemV2Schema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type QueryPaymentRegisterV2Response = z.infer<typeof QueryPaymentRegisterV2ResponseSchema>;

