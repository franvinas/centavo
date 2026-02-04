"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createExpenseForUser,
  updateExpenseForUser,
  deleteExpenseForUser,
} from "@/lib/services/expenses";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createExpense(formData: {
  amount: number;
  currency: string;
  description: string;
  categoryId: string;
  date: string;
  notes?: string;
}) {
  const userId = await requireAuth();
  await createExpenseForUser(userId, formData);

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

export async function updateExpense(
  id: string,
  formData: {
    amount?: number;
    currency?: string;
    description?: string;
    categoryId?: string;
    date?: string;
    notes?: string;
  },
) {
  const userId = await requireAuth();
  await updateExpenseForUser(userId, id, formData);

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
}

export async function deleteExpense(id: string) {
  const userId = await requireAuth();
  await deleteExpenseForUser(userId, id);

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}
