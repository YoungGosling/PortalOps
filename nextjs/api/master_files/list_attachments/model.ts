import { z } from "zod";

export const BillAttachmentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  service_name: z.string(),
  upload_date: z.string(),
  file_size: z.number().optional(),
});

export const ListAttachmentsResponseSchema = z.array(BillAttachmentSchema);

export type BillAttachment = z.infer<typeof BillAttachmentSchema>;
export type ListAttachmentsResponse = z.infer<typeof ListAttachmentsResponseSchema>;


