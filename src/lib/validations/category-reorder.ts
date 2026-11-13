import { z } from "zod/v4";

export const reorderCategoriesSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, "At least one category is required")
    .max(500, "Too many categories")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Category ids must be unique",
    }),
});

export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
