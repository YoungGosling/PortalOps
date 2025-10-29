import { z } from "zod";

export const AssignmentUpdateSchema = z.object({
  add: z.array(z.string()).optional(),
  remove: z.array(z.string()).optional(),
});

export const AssignmentsSchema = z.record(z.string(), AssignmentUpdateSchema);

export const UpdateUserPermissionRequestSchema = z.object({
  roles: z.array(z.string()),
  assignments: AssignmentsSchema,
});

export type AssignmentUpdate = z.infer<typeof AssignmentUpdateSchema>;
export type Assignments = z.infer<typeof AssignmentsSchema>;
export type UpdateUserPermissionRequest = z.infer<typeof UpdateUserPermissionRequestSchema>;

