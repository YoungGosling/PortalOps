import { z } from "zod";

export const CurrencyStatsSchema = z.object({
  totalAmount: z.number(),
  currencyCode: z.string(),
  currencySymbol: z.string().nullable().optional(),
});

export type CurrencyStats = z.infer<typeof CurrencyStatsSchema>;

