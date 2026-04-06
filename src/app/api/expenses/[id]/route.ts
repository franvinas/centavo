import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthUser,
  unauthorized,
  notFound,
  badRequest,
} from "@/lib/api-utils";
import { updateExpenseSchema } from "@/lib/validations/expense";
import {
  deleteExpenseForUser,
  updateExpenseForUser,
} from "@/lib/services/expenses";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(_request);
  if (!user) return unauthorized();

  const { id } = await params;
  const expense = await prisma.expense.findFirst({
    where: { id, userId: user.id },
    include: { category: true },
  });

  if (!expense) return notFound("Expense not found");

  return NextResponse.json({ expense });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const parsed = updateExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const expense = await updateExpenseForUser(user.id, id, parsed.data);
    return NextResponse.json({ expense });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update expense";

    if (message === "Expense not found") {
      return notFound(message);
    }

    return badRequest(message);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  try {
    const result = await deleteExpenseForUser(user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete expense";

    if (message === "Expense not found") {
      return notFound(message);
    }

    return badRequest(message);
  }
}
