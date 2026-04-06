import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { createExpenseSchema } from "@/lib/validations/expense";
import { getExpenses } from "@/lib/data/expenses";
import { createExpenseForUser } from "@/lib/services/expenses";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50")),
  );

  const { expenses, total, totalPages } = await getExpenses({
    userId: user.id,
    from: from ?? undefined,
    to: to ?? undefined,
    categoryId: categoryId ?? undefined,
    search: search ?? undefined,
    page,
    limit,
  });

  return NextResponse.json({
    expenses,
    total,
    page,
    totalPages,
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = createExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const expense = await createExpenseForUser(user.id, parsed.data);

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to create expense",
    );
  }
}
