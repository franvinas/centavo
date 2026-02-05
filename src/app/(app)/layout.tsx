import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TimezoneDetector } from "@/components/timezone-detector";
import { getCurrentUser } from "@/lib/data/user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user && !user.name) redirect("/onboarding");

  return (
    <AppShell user={user ? { name: user.name ?? "", email: user.email } : null}>
      {user && <TimezoneDetector currentTimezone={user.timezone ?? null} />}
      {children}
    </AppShell>
  );
}
