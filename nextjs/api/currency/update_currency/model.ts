import { z } from "zod";

export const UpdateCurrencyRequestSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  description: z.string().optional(),
});

export const UpdateCurrencyResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UpdateCurrencyRequest = z.infer<typeof UpdateCurrencyRequestSchema>;
export type UpdateCurrencyResponse = z.infer<typeof UpdateCurrencyResponseSchema>;


