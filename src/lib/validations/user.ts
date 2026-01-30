import { z } from "zod/v4";

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseCurrency: z.string().length(3).toUpperCase().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
