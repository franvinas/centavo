"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validations/user";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function updateUser(formData: {
  name?: string;
  baseCurrency?: string;
}) {
  const userId = await requireAuth();
  const parsed = updateUserSchema.parse(formData);

  await prisma.user.update({
    where: { id: userId },
    data: parsed,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  revalidatePath("/expenses");
  revalidatePath("/analytics");
}
