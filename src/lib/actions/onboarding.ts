"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { completeOnboardingSchema } from "@/lib/validations/onboarding";

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

  redirect("/dashboard");
}
