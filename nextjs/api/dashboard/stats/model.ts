import { z } from "zod";

export const DashboardStatsSchema = z.object({
  totalServices: z.number().optional(),  // Deprecated - kept for backward compatibility
  totalProducts: z.number().optional(),  // Deprecated - kept for backward compatibility
  totalUsers: z.number().optional(),  // Deprecated - kept for backward compatibility
  totalAmount: z.number().optional(),  // Deprecated - kept for backward compatibility
  incompletePayments: z.number(),
  currencyAmounts: z.record(z.string(), z.number()).optional(),  // Deprecated
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

