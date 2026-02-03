import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  return (
    <SettingsClient
      user={{
        name: user.name ?? "",
        email: user.email,
        baseCurrency: user.baseCurrency,
        locale: user.locale,
      }}
    />
  );
}
