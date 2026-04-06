import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { hasAnyCategories } from "@/lib/data/onboarding";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const hasCategories = await hasAnyCategories(user.id);
  if (user.name && hasCategories) redirect("/dashboard");
  const initialLocale: Locale = locales.includes(user.locale as Locale)
    ? (user.locale as Locale)
    : defaultLocale;

  return (
    <OnboardingForm
      initialName={user.name ?? ""}
      initialCurrency={user.baseCurrency}
      initialLocale={initialLocale}
    />
  );
}
