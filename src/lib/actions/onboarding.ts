"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { completeSetupForUser } from "@/lib/services/setup";
import { auth } from "@/lib/auth";
import { completeOnboardingSchema } from "@/lib/validations/onboarding";

export async function completeOnboarding(formData: {
  name: string;
  baseCurrency: string;
  locale: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const parsed = completeOnboardingSchema.parse(formData);
  const cookieStore = await cookies();

  await completeSetupForUser(session.user.id, parsed);

  cookieStore.set("NEXT_LOCALE", parsed.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  redirect("/dashboard");
}
