import { z } from "zod";

export const PaymentSummarySchema = z.object({
  incompleteCount: z.number().int(),
});

export type PaymentSummary = z.infer<typeof PaymentSummarySchema>;

