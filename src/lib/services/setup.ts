import { prisma } from "@/lib/db";
import { getDefaultCategories } from "@/lib/default-categories";
import {
  completeOnboardingSchema,
  type CompleteOnboardingInput,
} from "@/lib/validations/onboarding";

export async function completeSetupForUser(
  userId: string,
  input: CompleteOnboardingInput,
) {
  const parsed = completeOnboardingSchema.parse(input);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.name,
      baseCurrency: parsed.baseCurrency,
      locale: parsed.locale,
    },
  });

  const categoryCount = await prisma.category.count({
    where: { userId },
  });

  if (categoryCount === 0) {
    const categories = await getDefaultCategories(parsed.locale);
    await prisma.category.createMany({
      data: categories.map((category) => ({
        userId,
        name: category.name,
        color: category.color,
        icon: category.icon,
      })),
    });
  }

  return user;
}
