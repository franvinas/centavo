"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/category";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createCategory(formData: {
  name: string;
  color: string;
  icon?: string;
}) {
  const userId = await requireAuth();
  const parsed = createCategorySchema.parse(formData);

  const existing = await prisma.category.findUnique({
    where: { userId_name: { userId, name: parsed.name } },
  });
  if (existing) throw new Error("Category already exists");

  await prisma.category.create({
    data: { userId, ...parsed },
  });

  revalidatePath("/categories");
  revalidatePath("/dashboard");
}

export async function updateCategory(
  id: string,
  formData: { name?: string; color?: string; icon?: string },
) {
  const userId = await requireAuth();
  const parsed = updateCategorySchema.parse(formData);

  const existing = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Category not found");

  if (parsed.name && parsed.name !== existing.name) {
    const duplicate = await prisma.category.findUnique({
      where: { userId_name: { userId, name: parsed.name } },
    });
    if (duplicate) throw new Error("Category name already exists");
  }

  await prisma.category.update({
    where: { id },
    data: parsed,
  });

  revalidatePath("/categories");
  revalidatePath("/dashboard");
}

export async function deleteCategory(id: string) {
  const userId = await requireAuth();

  const existing = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Category not found");

  const expenseCount = await prisma.expense.count({
    where: { categoryId: id },
  });
  if (expenseCount > 0) {
    throw new Error(
      `Category has ${expenseCount} expense${expenseCount === 1 ? "" : "s"}. Reassign them first.`,
    );
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/categories");
  revalidatePath("/dashboard");
}
