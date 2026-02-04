import {
  createExpenseForUser,
  updateExpenseForUser,
  deleteExpenseForUser,
} from "@/lib/services/expenses";
import { getExpenses, getExpenseSummary } from "@/lib/data/expenses";
import { getSpendingByCategory } from "@/lib/data/analytics";
import { getCategories } from "@/lib/data/categories";

function serializeExpense(e: Record<string, unknown>) {
  return {
    id: e.id,
    description: e.description,
    amount: Number(e.amount),
    currency: e.currency,
    baseAmount: Number(e.baseAmount),
    date: e.date instanceof Date ? e.date.toISOString().split("T")[0] : e.date,
    category: e.category
      ? {
          id: (e.category as Record<string, unknown>).id,
          name: (e.category as Record<string, unknown>).name,
        }
      : undefined,
    notes: e.notes,
  };
}

export async function executeTool(
  userId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (toolName) {
    case "add_expense": {
      const expense = await createExpenseForUser(userId, {
        amount: args.amount as number,
        currency: args.currency as string,
        description: args.description as string,
        categoryId: args.categoryId as string,
        date: args.date as string,
        notes: args.notes as string | undefined,
      });
      return JSON.stringify(serializeExpense(expense as never));
    }

    case "edit_expense": {
      const { expenseId, ...updates } = args;
      const expense = await updateExpenseForUser(
        userId,
        expenseId as string,
        updates as {
          amount?: number;
          currency?: string;
          description?: string;
          categoryId?: string;
          date?: string;
          notes?: string;
        },
      );
      return JSON.stringify(serializeExpense(expense as never));
    }

    case "delete_expense": {
      const result = await deleteExpenseForUser(
        userId,
        args.expenseId as string,
      );
      return JSON.stringify(result);
    }

    case "list_expenses": {
      const { expenses } = await getExpenses({
        userId,
        from: args.from as string | undefined,
        to: args.to as string | undefined,
        categoryId: args.categoryId as string | undefined,
        search: args.search as string | undefined,
        limit: (args.limit as number) ?? 10,
      });
      return JSON.stringify(expenses.map((e) => serializeExpense(e as never)));
    }

    case "get_summary": {
      const summary = await getExpenseSummary(userId);
      return JSON.stringify({
        totalSpent: summary.totalSpent,
        expenseCount: summary.expenseCount,
        lastMonthTotal: summary.lastMonthTotal,
        lastMonthCount: summary.lastMonthCount,
        recentExpenses: summary.recentExpenses
          .slice(0, 5)
          .map((e) => serializeExpense(e as never)),
      });
    }

    case "get_analytics_by_category": {
      const data = await getSpendingByCategory({
        userId,
        from: new Date(args.from as string),
        to: new Date(args.to as string),
      });
      return JSON.stringify(data);
    }

    case "list_categories": {
      const categories = await getCategories(userId);
      return JSON.stringify(
        categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
      );
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
