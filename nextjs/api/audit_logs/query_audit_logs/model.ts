import { z } from "zod";

// Audit log item schema
export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  actor_user_id: z.string().uuid().nullable(),
  actor_name: z.string().nullable(),
  target_id: z.string().nullable(),
  details: z.record(z.any()).nullable(),
  created_at: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// Pagination schema
export const PaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// Response schema
export const AuditLogsResponseSchema = z.object({
  data: z.array(AuditLogSchema),
  pagination: PaginationSchema,
});

export type AuditLogsResponse = z.infer<typeof AuditLogsResponseSchema>;

// Query parameters
export interface QueryAuditLogsParams {
  actor_user_id?: string;
  action?: string;
  page?: number;
  limit?: number;
}






