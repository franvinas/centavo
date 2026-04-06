"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { completeOnboardingSchema } from "@/lib/validations/onboarding";
import { getDefaultCategories } from "@/lib/default-categories";

export async function completeOnboarding(formData: {
  name: string;
  baseCurrency: string;
  locale: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const parsed = completeOnboardingSchema.parse(formData);
  const cookieStore = await cookies();

  cookieStore.set("NEXT_LOCALE", parsed.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.name,
      baseCurrency: parsed.baseCurrency,
      locale: parsed.locale,
    },
  });

  const categoryCount = await prisma.category.count({
    where: { userId: session.user.id },
  });

  if (categoryCount === 0) {
    const categories = await getDefaultCategories(parsed.locale);
    await prisma.category.createMany({
      data: categories.map((cat) => ({
        userId: session.user!.id!,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      })),
    });
  }

  redirect("/dashboard");
}
