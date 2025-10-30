import { z } from "zod";

// For download endpoints, we typically return a Blob
// The model here is mainly for type safety
export const DownloadAttachmentParamsSchema = z.object({
  file_id: z.string(),
});

export type DownloadAttachmentParams = z.infer<typeof DownloadAttachmentParamsSchema>;


