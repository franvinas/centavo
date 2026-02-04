"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { signOut } from "next-auth/react";
import { updateUser } from "@/lib/actions/user";
import { updateLocale } from "@/lib/actions/locale";
import { CURRENCIES } from "@/lib/constants";
import { locales, type Locale } from "@/i18n/config";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

interface SettingsClientProps {
  user: {
    name: string;
    email: string;
    baseCurrency: string;
    locale: string;
    telegramChatId: string | null;
  };
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name);
  const [baseCurrency, setBaseCurrency] = useState(user.baseCurrency);
  const [saved, setSaved] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(!!user.telegramChatId);
  const [linkCode, setLinkCode] = useState("");
  const [linkError, setLinkError] = useState("");
  const t = useTranslations("settings");

  function handleSave() {
    startTransition(async () => {
      await updateUser({ name, baseCurrency });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleLocaleChange(locale: string) {
    startTransition(async () => {
      await updateLocale(locale);
      router.refresh();
    });
  }

  function handleTelegramLink() {
    setLinkError("");
    startTransition(async () => {
      const res = await fetch("/api/telegram/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: linkCode }),
      });
      if (res.ok) {
        setTelegramLinked(true);
        setLinkCode("");
      } else {
        const data = await res.json();
        setLinkError(data.error ?? "Failed to link");
      }
    });
  }

  function handleTelegramUnlink() {
    startTransition(async () => {
      const res = await fetch("/api/telegram/link", { method: "DELETE" });
      if (res.ok) {
        setTelegramLinked(false);
      }
    });
  }

  const hasChanges = name !== user.name || baseCurrency !== user.baseCurrency;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-semibold">
          {t("title")}
        </h1>
        <p className="text-text-secondary mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {/* Profile */}
      <div className="bg-bg-surface shadow-card rounded-lg p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-accent-light text-accent-primary text-lg font-semibold">
              {(name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base font-medium"
              aria-label="Display name"
            />
            <p className="text-text-tertiary mt-1 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Currency */}
      <div className="bg-bg-surface shadow-card rounded-lg p-6">
        <h2 className="text-text-primary mb-3 text-base font-semibold">
          {t("baseCurrency")}
        </h2>
        <p className="text-text-secondary mb-4 text-sm">{t("currencyHint")}</p>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((cur) => (
            <button
              key={cur}
              onClick={() => setBaseCurrency(cur)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                baseCurrency === cur
                  ? "bg-accent-primary text-white"
                  : "bg-bg-muted text-text-secondary hover:bg-border-subtle"
              }`}
            >
              {cur}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-bg-surface shadow-card rounded-lg p-6">
        <h2 className="text-text-primary mb-3 text-base font-semibold">
          {t("language")}
        </h2>
        <p className="text-text-secondary mb-4 text-sm">{t("languageHint")}</p>
        <div className="flex flex-wrap gap-2">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              disabled={isPending}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                user.locale === loc
                  ? "bg-accent-primary text-white"
                  : "bg-bg-muted text-text-secondary hover:bg-border-subtle"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>

      {/* Telegram */}
      <div className="bg-bg-surface shadow-card rounded-lg p-6">
        <h2 className="text-text-primary mb-3 text-base font-semibold">
          <MessageCircle className="mr-2 inline-block h-4 w-4" />
          {t("telegram")}
        </h2>
        <p className="text-text-secondary mb-4 text-sm">{t("telegramHint")}</p>
        {telegramLinked ? (
          <div className="flex items-center justify-between">
            <span className="bg-accent-light text-accent-primary rounded-full px-3 py-1 text-sm font-medium">
              {t("telegramLinked")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTelegramUnlink}
              disabled={isPending}
            >
              {t("unlinkButton")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value)}
                placeholder={t("linkCode")}
                className="flex-1"
              />
              <Button
                onClick={handleTelegramLink}
                disabled={isPending || !linkCode.trim()}
                className="bg-accent-primary hover:bg-accent-primary/90 text-white"
              >
                {t("linkButton")}
              </Button>
            </div>
            {linkError && (
              <p className="text-status-negative text-sm">{linkError}</p>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-accent-primary hover:bg-accent-primary/90 w-full text-white"
        >
          {isPending ? t("saving") : saved ? t("saved") : t("save")}
        </Button>
      )}

      <Separator className="bg-border-subtle" />

      {/* Sign out */}
      <Button
        variant="outline"
        className="border-status-negative text-status-negative hover:bg-status-negative/10 w-full"
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {t("signOut")}
      </Button>
    </div>
  );
}
