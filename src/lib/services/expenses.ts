import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "@/lib/validations/expense";
import { buildValuation } from "./valuation";
import { presentExpense } from "@/lib/expense-valuation";
import {
  type ExpenseSelectorInput,
  bulkExpenseDeleteSchema,
  bulkExpenseUpdateSchema,
  importExpensesSchema,
} from "@/lib/validations/expense-bulk";

type DbClient = typeof prisma | Prisma.TransactionClient;

function buildExpenseWhere(
  userId: string,
  selectors: ExpenseSelectorInput = {},
): Record<string, unknown> {
  const where: Record<string, unknown> = { userId };

  if (selectors.ids?.length) {
    where.id = { in: selectors.ids };
  }

  if (selectors.search) {
    where.description = {
      contains: selectors.search,
      mode: "insensitive",
    };
  }

  if (selectors.categoryId) {
    where.categoryId = selectors.categoryId;
  }

  const date: Record<string, Date> = {};
  if (selectors.from) date.gte = new Date(selectors.from);
  if (selectors.to) date.lte = new Date(selectors.to);
  if (selectors.after) date.gt = new Date(selectors.after);
  if (selectors.before) date.lt = new Date(selectors.before);
  if (Object.keys(date).length > 0) where.date = date;

  return where;
}

async function ensureCategoryBelongsToUser(
  db: DbClient,
  userId: string,
  categoryId: string,
) {
  const category = await db.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Category not found");
  }
}

async function getUserBaseCurrency(db: DbClient, userId: string) {
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true },
  });

  return dbUser?.baseCurrency ?? "USD";
}

async function createExpenseWithClient(
  db: DbClient,
  userId: string,
  input: CreateExpenseInput,
  preparedValuation?: Awaited<ReturnType<typeof buildValuation>>,
) {
  await ensureCategoryBelongsToUser(db, userId, input.categoryId);

  const valuation =
    preparedValuation ??
    (await buildValuation(input.amount, input.currency, input.date));

  return db.expense.create({
    data: {
      userId,
      amount: input.amount,
      currency: input.currency,
      ...valuation,
      description: input.description,
      categoryId: input.categoryId,
      date: new Date(input.date),
      notes: input.notes,
    },
    include: { category: true },
  });
}

async function buildExpenseUpdateData(
  db: DbClient,
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput,
) {
  const existing = await db.expense.findFirst({
    where: { id: expenseId, userId },
  });
  if (!existing) throw new Error("Expense not found");

  const updateData: Record<string, unknown> = {};
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.date !== undefined) updateData.date = new Date(input.date);
  if (input.notes !== undefined) updateData.notes = input.notes;

  if (input.categoryId !== undefined) {
    await ensureCategoryBelongsToUser(db, userId, input.categoryId);
    updateData.categoryId = input.categoryId;
  }

  const amount = input.amount ?? Number(existing.amount);
  const currency = input.currency ?? existing.currency;
  const date = input.date ?? existing.date.toISOString().slice(0, 10);
  const quoteChanged =
    currency !== existing.currency ||
    date !== existing.date.toISOString().slice(0, 10);
  if (
    quoteChanged ||
    (input.amount !== undefined && amount !== Number(existing.amount))
  ) {
    Object.assign(
      updateData,
      await buildValuation(
        amount,
        currency,
        date,
        quoteChanged ? undefined : existing,
      ),
    );
    updateData.amount = amount;
    updateData.currency = currency;
  }

  return { updateData, updatedAt: existing.updatedAt };
}

export async function createExpenseForUser(
  userId: string,
  input: CreateExpenseInput,
) {
  const parsed = createExpenseSchema.parse(input);
  const expense = await createExpenseWithClient(prisma, userId, parsed);
  return presentExpense(expense, await getUserBaseCurrency(prisma, userId));
}

export async function updateExpenseForUser(
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput,
) {
  const parsed = updateExpenseSchema.parse(input);
  const { updateData, updatedAt } = await buildExpenseUpdateData(
    prisma,
    userId,
    expenseId,
    parsed,
  );

  const expense = await prisma.expense.update({
    where: { id: expenseId, userId, updatedAt },
    data: updateData,
    include: { category: true },
  });
  return presentExpense(expense, await getUserBaseCurrency(prisma, userId));
}

export async function deleteExpenseForUser(userId: string, expenseId: string) {
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });
  if (!existing) throw new Error("Expense not found");

  await prisma.expense.delete({ where: { id: expenseId } });
  return { success: true };
}

export async function listExpensesForUser(
  userId: string,
  selectors: ExpenseSelectorInput = {},
) {
  const expenses = await prisma.expense.findMany({
    where: buildExpenseWhere(userId, selectors),
    include: { category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const currency = await getUserBaseCurrency(prisma, userId);
  return expenses.map((expense) => presentExpense(expense, currency));
}

export async function bulkUpdateExpensesForUser(
  userId: string,
  input: {
    selectors: ExpenseSelectorInput;
    preview?: boolean;
    data: UpdateExpenseInput & { clearNotes?: boolean };
  },
) {
  const parsed = bulkExpenseUpdateSchema.parse(input);
  const expenses = await listExpensesForUser(userId, parsed.selectors);

  if (parsed.preview) {
    return {
      preview: true,
      matched: expenses.length,
      changes: parsed.data,
      items: expenses,
    };
  }

  // Resolve external quotes before opening a database transaction.
  const updates: Array<{
    expense: (typeof expenses)[number];
    updateData: Record<string, unknown>;
  }> = [];
  for (const expense of expenses) {
    const { updateData } = await buildExpenseUpdateData(
      prisma,
      userId,
      expense.id,
      {
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        date: parsed.data.date,
        notes: parsed.data.clearNotes ? "" : parsed.data.notes,
      },
    );
    if (parsed.data.clearNotes) updateData.notes = null;
    updates.push({ expense, updateData });
  }
  const updatedExpenses = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const { expense, updateData } of updates) {
      results.push(
        await tx.expense.update({
          where: { id: expense.id, userId, updatedAt: expense.updatedAt },
          data: updateData,
          include: { category: true },
        }),
      );
    }
    return results;
  });

  return {
    preview: false,
    matched: expenses.length,
    changed: updatedExpenses.length,
    items: updatedExpenses.map((expense) =>
      presentExpense(expense, expenses[0]?.baseCurrency ?? "USD"),
    ),
  };
}

export async function bulkDeleteExpensesForUser(
  userId: string,
  input: {
    selectors: ExpenseSelectorInput;
    preview?: boolean;
  },
) {
  const parsed = bulkExpenseDeleteSchema.parse(input);
  const expenses = await listExpensesForUser(userId, parsed.selectors);

  if (parsed.preview) {
    return {
      preview: true,
      matched: expenses.length,
      items: expenses,
    };
  }

  const ids = expenses.map((expense) => expense.id);

  if (ids.length > 0) {
    await prisma.expense.deleteMany({
      where: {
        userId,
        id: { in: ids },
      },
    });
  }

  return {
    preview: false,
    matched: expenses.length,
    changed: ids.length,
    ids,
  };
}

export async function importExpensesForUser(
  userId: string,
  input: {
    items: CreateExpenseInput[];
    continueOnError?: boolean;
    dryRun?: boolean;
  },
) {
  const parsed = importExpensesSchema.parse(input);
  const errors: Array<{ index: number; message: string }> = [];

  if (parsed.dryRun) {
    for (const [index, item] of parsed.items.entries()) {
      try {
        createExpenseSchema.parse(item);
        await ensureCategoryBelongsToUser(prisma, userId, item.categoryId);
      } catch (error) {
        errors.push({
          index,
          message: error instanceof Error ? error.message : "Invalid expense",
        });
      }
    }

    return {
      preview: true,
      created: 0,
      items: [],
      errors,
    };
  }

  const displayCurrency = await getUserBaseCurrency(prisma, userId);
  if (!parsed.continueOnError) {
    const valuations: Awaited<ReturnType<typeof buildValuation>>[] = [];
    for (const item of parsed.items)
      valuations.push(
        await buildValuation(item.amount, item.currency, item.date),
      );
    const createdExpenses = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const [index, item] of parsed.items.entries()) {
        const expense = await createExpenseWithClient(
          tx,
          userId,
          createExpenseSchema.parse(item),
          valuations[index],
        );
        created.push(expense);
      }
      return created;
    });

    return {
      preview: false,
      created: createdExpenses.length,
      items: createdExpenses.map((expense) =>
        presentExpense(expense, displayCurrency),
      ),
      errors: [],
    };
  }

  const createdExpenses = [];
  for (const [index, item] of parsed.items.entries()) {
    try {
      const expense = await createExpenseForUser(userId, item);
      createdExpenses.push(expense);
    } catch (error) {
      errors.push({
        index,
        message: error instanceof Error ? error.message : "Invalid expense",
      });
    }
  }

  return {
    preview: false,
    created: createdExpenses.length,
    items: createdExpenses,
    errors,
  };
}
