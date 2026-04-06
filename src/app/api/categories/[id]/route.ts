import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthUser,
  unauthorized,
  notFound,
  badRequest,
} from "@/lib/api-utils";
import { updateCategorySchema } from "@/lib/validations/category";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.category.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) return notFound("Category not found");

  const body = await request.json();
  const parsed = updateCategorySchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  // Check for name uniqueness if name is being changed
  if (parsed.data.name && parsed.data.name !== existing.name) {
    const duplicate = await prisma.category.findUnique({
      where: { userId_name: { userId: user.id, name: parsed.data.name! } },
    });
    if (duplicate) {
      return badRequest("A category with this name already exists");
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ category });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.category.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) return notFound("Category not found");

  const expenseCount = await prisma.expense.count({
    where: { categoryId: id },
  });

  if (expenseCount > 0) {
    return badRequest(
      `Category has ${expenseCount} expense${expenseCount === 1 ? "" : "s"}. Reassign them first.`,
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
