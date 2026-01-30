import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getCurrentUser() {
  // Try auth session first
  const session = await auth();
  if (session?.user?.id) {
    return prisma.user.findUnique({
      where: { id: session.user.id },
    });
  }

  // Fallback to test user during development
  if (process.env.NODE_ENV === "development") {
    return prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });
  }

  return null;
}
