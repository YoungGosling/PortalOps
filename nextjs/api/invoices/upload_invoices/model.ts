import { z } from "zod";

// Invoice response schema
export const PaymentInvoiceResponseSchema = z.object({
  id: z.string().uuid(),
  original_file_name: z.string(),
  url: z.string(),
});

export const UploadInvoicesResponseSchema = z.array(PaymentInvoiceResponseSchema);

export type PaymentInvoiceResponse = z.infer<typeof PaymentInvoiceResponseSchema>;
export type UploadInvoicesResponse = z.infer<typeof UploadInvoicesResponseSchema>;

