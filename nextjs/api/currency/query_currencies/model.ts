import { z } from "zod";

export const CurrencySchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  description: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const QueryCurrenciesResponseSchema = z.array(CurrencySchema);

export type Currency = z.infer<typeof CurrencySchema>;
export type QueryCurrenciesResponse = z.infer<typeof QueryCurrenciesResponseSchema>;


