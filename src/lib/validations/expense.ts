import { z } from "zod/v4";

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .toUpperCase(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be under 200 characters"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().date("Invalid date format"),
  notes: z.string().max(500).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
