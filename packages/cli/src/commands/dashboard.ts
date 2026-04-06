import { createApiClient } from "../lib/api";
import { printKeyValue, printTable } from "../lib/output";
import type { CommandSpec } from "../lib/types";

export const dashboardCommand: CommandSpec = {
  name: "dashboard",
  summary: "Show a compact dashboard summary.",
  usage: ["centavo dashboard"],
  run: async (context) => {
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const [summaryResponse, categoriesResponse, expensesResponse] =
      await Promise.all([
        api.request<Record<string, unknown>>("/api/analytics/summary"),
        api.request<{ items: Array<Record<string, unknown>> }>(
          "/api/analytics/categories",
        ),
        api.request<{ expenses: Array<Record<string, unknown>> }>(
          "/api/expenses?limit=5",
        ),
      ]);

    const summary = summaryResponse.summary as Record<string, unknown>;
    printKeyValue([
      ["period", String(summaryResponse.periodLabel ?? "")],
      ["totalSpent", String(summary.totalSpent ?? "")],
      ["transactions", String(summary.transactionCount ?? "")],
      ["dailyAverage", String(summary.dailyAverage ?? "")],
      ["baseCurrency", String(summaryResponse.baseCurrency ?? "")],
    ]);

    process.stdout.write("\nTop categories\n");
    printTable(
      ["Category", "Total"],
      categoriesResponse.items
        .slice(0, 5)
        .map((item) => [String(item.name), String(item.total)]),
    );

    process.stdout.write("\nRecent expenses\n");
    printTable(
      ["ID", "Date", "Description", "Amount"],
      expensesResponse.expenses
        .slice(0, 5)
        .map((expense) => [
          String(expense.id),
          String(expense.date).slice(0, 10),
          String(expense.description),
          String(expense.amount),
        ]),
    );

    return 0;
  },
};
