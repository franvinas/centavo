import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TimezoneDetector } from "@/components/timezone-detector";
import { getCurrentUser } from "@/lib/data/user";
import { hasAnyCategories } from "@/lib/data/onboarding";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user) {
    const hasCategories = await hasAnyCategories(user.id);
    if (!user.name || !hasCategories) {
      redirect("/onboarding");
    }
  }

  return (
    <AppShell user={user ? { name: user.name ?? "", email: user.email } : null}>
      {user && <TimezoneDetector currentTimezone={user.timezone ?? null} />}
      {children}
    </AppShell>
  );
}
