import { cache } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (session?.user?.id) {
    return prisma.user.findUnique({
      where: { id: session.user.id },
    });
  }

  return null;
});
