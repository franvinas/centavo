import { z } from "zod/v4";

export const reassignCategorySchema = z
  .object({
    fromCategoryId: z.string().min(1, "Source category is required"),
    toCategoryId: z.string().min(1, "Destination category is required"),
  })
  .refine((value) => value.fromCategoryId !== value.toCategoryId, {
    message: "Source and destination categories must differ",
  });

export type ReassignCategoryInput = z.infer<typeof reassignCategorySchema>;
