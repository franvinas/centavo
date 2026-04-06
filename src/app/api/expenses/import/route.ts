import { NextRequest, NextResponse } from "next/server";
import { badRequest, getAuthUser, unauthorized } from "@/lib/api-utils";
import { importExpensesSchema } from "@/lib/validations/expense-bulk";
import { importExpensesForUser } from "@/lib/services/expenses";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const parsed = importExpensesSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const result = await importExpensesForUser(user.id, parsed.data);
    return NextResponse.json(result, {
      status: parsed.data.dryRun ? 200 : 201,
    });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to import expenses",
    );
  }
}
