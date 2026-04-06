import { z } from "zod/v4";
import { createExpenseSchema } from "@/lib/validations/expense";

const expenseSelectorBaseSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).optional(),
  search: z.string().trim().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  from: z.string().date("Invalid from date").optional(),
  to: z.string().date("Invalid to date").optional(),
  before: z.string().date("Invalid before date").optional(),
  after: z.string().date("Invalid after date").optional(),
});

export const expenseSelectorSchema = expenseSelectorBaseSchema.refine(
  (value) =>
    Boolean(
      value.ids?.length ||
      value.search ||
      value.categoryId ||
      value.from ||
      value.to ||
      value.before ||
      value.after,
    ),
  {
    message: "At least one selector is required",
  },
);

export const expenseListSelectorSchema = expenseSelectorBaseSchema;

export const bulkExpenseUpdateSchema = z
  .object({
    selectors: expenseSelectorSchema,
    preview: z.boolean().optional(),
    data: z
      .object({
        amount: createExpenseSchema.shape.amount.optional(),
        currency: createExpenseSchema.shape.currency.optional(),
        description: createExpenseSchema.shape.description.optional(),
        categoryId: createExpenseSchema.shape.categoryId.optional(),
        date: createExpenseSchema.shape.date.optional(),
        notes: createExpenseSchema.shape.notes.optional(),
        clearNotes: z.boolean().optional(),
      })
      .refine(
        (value) =>
          Boolean(
            value.amount !== undefined ||
            value.currency !== undefined ||
            value.description !== undefined ||
            value.categoryId !== undefined ||
            value.date !== undefined ||
            value.notes !== undefined ||
            value.clearNotes,
          ),
        {
          message: "At least one update field is required",
        },
      )
      .refine((value) => !(value.notes !== undefined && value.clearNotes), {
        message: "Cannot set notes and clear them at the same time",
      }),
  })
  .strict();

export const bulkExpenseDeleteSchema = z
  .object({
    selectors: expenseSelectorSchema,
    preview: z.boolean().optional(),
  })
  .strict();

export const importExpensesSchema = z
  .object({
    items: z
      .array(createExpenseSchema)
      .min(1, "At least one expense is required"),
    continueOnError: z.boolean().optional(),
    dryRun: z.boolean().optional(),
  })
  .strict();

export type ExpenseSelectorInput = z.infer<typeof expenseListSelectorSchema>;
export type BulkExpenseUpdateInput = z.infer<typeof bulkExpenseUpdateSchema>;
export type BulkExpenseDeleteInput = z.infer<typeof bulkExpenseDeleteSchema>;
export type ImportExpensesInput = z.infer<typeof importExpensesSchema>;
