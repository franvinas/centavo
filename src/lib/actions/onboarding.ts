"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { completeOnboardingSchema } from "@/lib/validations/onboarding";
import { getDefaultCategories } from "@/lib/default-categories";

export async function completeOnboarding(formData: {
  name: string;
  baseCurrency: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const parsed = completeOnboardingSchema.parse(formData);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.name,
      baseCurrency: parsed.baseCurrency,
    },
  });

  const categoryCount = await prisma.category.count({
    where: { userId: session.user.id },
  });

  if (categoryCount === 0) {
    const locale = await getLocale();
    const categories = await getDefaultCategories(locale);
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
