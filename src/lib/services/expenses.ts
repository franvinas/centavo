import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "@/lib/validations/expense";
import { getExchangeRate } from "@/lib/exchange-rate";
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
) {
  await ensureCategoryBelongsToUser(db, userId, input.categoryId);

  const baseCurrency = await getUserBaseCurrency(db, userId);
  const exchangeRate = await getExchangeRate(input.currency, baseCurrency);
  const baseAmount = parseFloat((input.amount * exchangeRate).toFixed(2));

  return db.expense.create({
    data: {
      userId,
      amount: input.amount,
      currency: input.currency,
      baseAmount,
      exchangeRate,
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

  if (input.amount !== undefined || input.currency !== undefined) {
    const amount = input.amount ?? Number(existing.amount);
    const currency = input.currency ?? existing.currency;
    const baseCurrency = await getUserBaseCurrency(db, userId);
    const exchangeRate = await getExchangeRate(currency, baseCurrency);

    updateData.amount = amount;
    updateData.currency = currency;
    updateData.baseAmount = parseFloat((amount * exchangeRate).toFixed(2));
    updateData.exchangeRate = exchangeRate;
  }

  return updateData;
}

export async function createExpenseForUser(
  userId: string,
  input: CreateExpenseInput,
) {
  const parsed = createExpenseSchema.parse(input);
  return createExpenseWithClient(prisma, userId, parsed);
}

export async function updateExpenseForUser(
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput,
) {
  const parsed = updateExpenseSchema.parse(input);
  const updateData = await buildExpenseUpdateData(
    prisma,
    userId,
    expenseId,
    parsed,
  );

  return prisma.expense.update({
    where: { id: expenseId },
    data: updateData,
    include: { category: true },
  });
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
  return prisma.expense.findMany({
    where: buildExpenseWhere(userId, selectors),
    include: { category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
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

  const updatedExpenses = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const expense of expenses) {
      const updateInput: UpdateExpenseInput = {
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        date: parsed.data.date,
        notes: parsed.data.clearNotes ? "" : parsed.data.notes,
      };
      const updateData = await buildExpenseUpdateData(
        tx,
        userId,
        expense.id,
        updateInput,
      );

      if (parsed.data.clearNotes) {
        updateData.notes = null;
      }

      const updated = await tx.expense.update({
        where: { id: expense.id },
        data: updateData,
        include: { category: true },
      });
      results.push(updated);
    }

    return results;
  });

  return {
    preview: false,
    matched: expenses.length,
    changed: updatedExpenses.length,
    items: updatedExpenses,
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

  if (!parsed.continueOnError) {
    const createdExpenses = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const item of parsed.items) {
        const expense = await createExpenseWithClient(
          tx,
          userId,
          createExpenseSchema.parse(item),
        );
        created.push(expense);
      }
      return created;
    });

    return {
      preview: false,
      created: createdExpenses.length,
      items: createdExpenses,
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
