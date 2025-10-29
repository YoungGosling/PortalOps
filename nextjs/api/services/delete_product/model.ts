import { z } from "zod";

export const DeleteProductResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type DeleteProductResponse = z.infer<typeof DeleteProductResponseSchema>;

