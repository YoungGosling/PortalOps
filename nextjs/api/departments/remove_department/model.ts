import { z } from "zod";

// Delete department returns 204 No Content, so no response body
export const DeleteDepartmentResponseSchema = z.void();

export type DeleteDepartmentResponse = z.infer<typeof DeleteDepartmentResponseSchema>;

