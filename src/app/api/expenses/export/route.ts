import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/api-utils";
import { expenseListSelectorSchema } from "@/lib/validations/expense-bulk";
import { listExpensesForUser } from "@/lib/services/expenses";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const ids = request.nextUrl.searchParams.getAll("id");
  const parsed = expenseListSelectorSchema.parse({
    ids: ids.length > 0 ? ids : undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    categoryId: request.nextUrl.searchParams.get("categoryId") ?? undefined,
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
    before: request.nextUrl.searchParams.get("before") ?? undefined,
    after: request.nextUrl.searchParams.get("after") ?? undefined,
  });

  const expenses = await listExpensesForUser(user.id, parsed);

  return NextResponse.json({
    expenses,
    total: expenses.length,
  });
}
