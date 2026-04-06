import { NextRequest, NextResponse } from "next/server";
import { badRequest, getAuthUser, unauthorized } from "@/lib/api-utils";
import { bulkExpenseDeleteSchema } from "@/lib/validations/expense-bulk";
import { bulkDeleteExpensesForUser } from "@/lib/services/expenses";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const parsed = bulkExpenseDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const result = await bulkDeleteExpensesForUser(user.id, parsed.data);
  return NextResponse.json(result);
}
