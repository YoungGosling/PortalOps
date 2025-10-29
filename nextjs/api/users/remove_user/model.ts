import { z } from "zod";

export const RemoveUserResponseSchema = z.object({
  success: z.boolean(),
});

export type RemoveUserResponse = z.infer<typeof RemoveUserResponseSchema>;

