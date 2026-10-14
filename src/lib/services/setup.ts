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

  const categories = await getDefaultCategories(parsed.locale);
  return prisma.$transaction(async (tx) => {
    // Serializes concurrent setup calls for the same existing user.
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        name: parsed.name,
        baseCurrency: parsed.baseCurrency,
        locale: parsed.locale,
      },
    });

    const categoryCount = await tx.category.count({
      where: { userId },
    });

    if (categoryCount === 0) {
      await tx.category.createMany({
        skipDuplicates: true,
        data: categories.map((category) => ({
          userId,
          name: category.name,
          color: category.color,
          icon: category.icon,
        })),
      });
    }

    return user;
  });
}
