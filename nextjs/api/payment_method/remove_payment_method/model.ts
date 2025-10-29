import { z } from "zod";

export const RemovePaymentMethodParamsSchema = z.object({
  method_id: z.number(),
});

export type RemovePaymentMethodParams = z.infer<typeof RemovePaymentMethodParamsSchema>;

