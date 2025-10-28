import { z } from "zod";

export const DashboardStatsSchema = z.object({
  totalServices: z.number(),
  totalProducts: z.number(),
  totalUsers: z.number(),
  totalAmount: z.number(),
  incompletePayments: z.number(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

