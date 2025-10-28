import { z } from "zod";

export const RootInfoSchema = z.object({
  message: z.string().optional(),
  version: z.string().optional(),
  name: z.string().optional(),
});

export type RootInfo = z.infer<typeof RootInfoSchema>;

