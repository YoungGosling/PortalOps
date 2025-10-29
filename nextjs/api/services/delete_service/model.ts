import { z } from "zod";

export const DeleteServiceResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type DeleteServiceResponse = z.infer<typeof DeleteServiceResponseSchema>;

