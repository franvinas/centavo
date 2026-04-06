import { NextRequest, NextResponse } from "next/server";
import { badRequest, getAuthUser, unauthorized } from "@/lib/api-utils";
import { bulkExpenseUpdateSchema } from "@/lib/validations/expense-bulk";
import { bulkUpdateExpensesForUser } from "@/lib/services/expenses";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const parsed = bulkExpenseUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const result = await bulkUpdateExpensesForUser(user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to update expenses",
    );
  }
}
