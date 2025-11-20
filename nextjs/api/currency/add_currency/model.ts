import { z } from "zod";

export const AddCurrencyRequestSchema = z.object({
  code: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  description: z.string().optional(),
});

export const AddCurrencyResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AddCurrencyRequest = z.infer<typeof AddCurrencyRequestSchema>;
export type AddCurrencyResponse = z.infer<typeof AddCurrencyResponseSchema>;


