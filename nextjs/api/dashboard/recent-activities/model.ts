import { z } from "zod";

// Backend returns data in camelCase format
export const RecentActivitySchema = z.object({
  id: z.string(),
  action: z.string(),
  actorName: z.string(),        // Backend uses camelCase
  targetId: z.string().nullable(),
  details: z.any().nullable(),   // Backend can return various types
  createdAt: z.string(),         // Backend uses camelCase: ISO datetime string
});

// Backend returns an array directly, not wrapped in an object
export const RecentActivitiesResponseSchema = z.array(RecentActivitySchema);

export type RecentActivity = z.infer<typeof RecentActivitySchema>;
export type RecentActivitiesResponse = z.infer<typeof RecentActivitiesResponseSchema>;

