import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  if (user.name) redirect("/dashboard");

  return <OnboardingForm />;
}
