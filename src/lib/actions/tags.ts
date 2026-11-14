"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deleteTagForUser, renameTagForUser } from "@/lib/services/tags";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function revalidateTagViews() {
  revalidatePath("/settings");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function renameTag(id: string, name: string) {
  const userId = await requireAuth();
  const { tag, merged } = await renameTagForUser(userId, id, { name });
  revalidateTagViews();
  return { name: tag.name, merged };
}

export async function deleteTag(id: string) {
  const userId = await requireAuth();
  await deleteTagForUser(userId, id);
  revalidateTagViews();
}
