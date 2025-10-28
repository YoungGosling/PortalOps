import { z } from "zod";

export const UpcomingResponseSchema = z.array(z.object({
  productId: z.string(),
  productName: z.string(),
  serviceName: z.string(),
  expiryDate: z.string(), // Format: MM/DD/YYYY from backend
  amount: z.number().nullable(),
  cardholderName: z.string().nullable(),
  paymentMethod: z.string().nullable(),
}));

export type UpcomingRenewal = z.infer<typeof UpcomingResponseSchema>;

