import { z } from "zod";

export const MasterFileInvoiceSchema = z.object({
  id: z.string(),
  file_name: z.string(),
  original_file_name: z.string(),
  payment_info_id: z.string(),
  product_name: z.string(),
  service_name: z.string(),
  created_at: z.string(),
});

export const QueryInvoicesResponseSchema = z.array(MasterFileInvoiceSchema);

export type MasterFileInvoice = z.infer<typeof MasterFileInvoiceSchema>;
export type QueryInvoicesResponse = z.infer<typeof QueryInvoicesResponseSchema>;

