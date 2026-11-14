import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getTagsWithTotals } from "@/lib/data/tags";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const tags = await getTagsWithTotals(user.id);

  return (
    <SettingsClient
      user={{
        name: user.name ?? "",
        email: user.email,
        baseCurrency: user.baseCurrency,
        locale: user.locale,
        telegramChatId: user.telegramChatId ?? null,
      }}
      tags={tags}
    />
  );
}
