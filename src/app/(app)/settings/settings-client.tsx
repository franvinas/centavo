"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Send, Check, Coins, Languages } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { clearLegacyCaches } from "@/lib/cache-privacy";
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
  const [linkError, setLinkError] = useState("");
  const t = useTranslations("settings");

  function handleSave() {
    setLinkError("");
    startTransition(async () => {
      try {
        await updateUser({ name, baseCurrency });
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setLinkError(t("saveError"));
      }
    });
  }

  function handleLocaleChange(locale: string) {
    startTransition(async () => {
      try {
        await updateLocale(locale);
        router.refresh();
      } catch {
        setLinkError(t("saveError"));
      }
    });
  }

  function handleTelegramLink() {
    setLinkError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/telegram/link", {
          method: "POST",
        });

        if (res.ok) {
          const data = (await res.json()) as { url?: string };
          if (data.url) {
            window.open(data.url, "_blank", "noopener,noreferrer");
          }

          setTimeout(() => {
            router.refresh();
          }, 2000);
        } else {
          setLinkError(t("connectionError"));
        }
      } catch {
        setLinkError(t("connectionError"));
      }
    });
  }

  function handleTelegramUnlink() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/telegram/link", { method: "DELETE" });
        if (res.ok) {
          router.refresh();
        } else setLinkError(t("connectionError"));
      } catch {
        setLinkError(t("connectionError"));
      }
    });
  }

  const hasChanges = name !== user.name || baseCurrency !== user.baseCurrency;

  const card =
    "bg-bg-surface shadow-card border-border-subtle/60 rounded-2xl border p-5 md:p-6";
  const segment = (active: boolean) =>
    `h-9 flex-1 rounded-[10px] px-4 text-sm font-semibold transition-all sm:flex-none ${
      active
        ? "bg-bg-surface text-text-primary shadow-subtle"
        : "text-text-tertiary hover:text-text-secondary"
    }`;

  return (
    <div className="animate-page-in max-w-2xl space-y-5">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Profile */}
      <section className={card}>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0 md:h-16 md:w-16">
            <AvatarFallback className="bg-accent-light text-accent-primary text-xl font-semibold">
              {(name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <label
              htmlFor="settings-name"
              className="text-text-tertiary mb-1 block text-xs font-medium"
            >
              {t("name")}
            </label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-border-subtle h-11 rounded-xl px-3.5 text-base font-medium md:h-10"
              aria-label={t("name")}
              autoComplete="name"
            />
            <p className="text-text-tertiary mt-1.5 truncate text-sm">
              {user.email}
            </p>
          </div>
        </div>
      </section>

      {/* Currency */}
      <section className={card}>
        <SectionTitle icon={Coins}>{t("baseCurrency")}</SectionTitle>
        <p className="text-text-secondary mb-4 text-sm">{t("currencyHint")}</p>
        <div
          role="radiogroup"
          aria-label={t("baseCurrency")}
          className="bg-bg-muted flex rounded-xl p-1 sm:inline-flex"
        >
          {CURRENCIES.map((cur) => (
            <button
              key={cur}
              role="radio"
              aria-checked={baseCurrency === cur}
              onClick={() => setBaseCurrency(cur)}
              className={segment(baseCurrency === cur)}
            >
              {cur}
            </button>
          ))}
        </div>
      </section>

      {/* Language */}
      <section className={card}>
        <SectionTitle icon={Languages}>{t("language")}</SectionTitle>
        <p className="text-text-secondary mb-4 text-sm">{t("languageHint")}</p>
        <div
          role="radiogroup"
          aria-label={t("language")}
          className="bg-bg-muted flex rounded-xl p-1 sm:inline-flex"
        >
          {locales.map((loc) => (
            <button
              key={loc}
              role="radio"
              aria-checked={user.locale === loc}
              onClick={() => handleLocaleChange(loc)}
              disabled={isPending}
              className={segment(user.locale === loc)}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      </section>

      {/* Telegram */}
      <section className={card}>
        <SectionTitle icon={Send}>{t("telegram")}</SectionTitle>
        <p className="text-text-secondary mb-4 text-sm">{t("telegramHint")}</p>
        {user.telegramChatId ? (
          <div className="flex items-center justify-between gap-3">
            <span className="bg-accent-soft text-accent-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium">
              <Check className="h-4 w-4" />
              {t("telegramLinked")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTelegramUnlink}
              disabled={isPending}
              className="border-border-subtle h-9 rounded-xl"
            >
              {t("unlinkButton")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={handleTelegramLink}
              disabled={isPending}
              className="bg-accent-primary hover:bg-accent-hover h-11 w-full rounded-xl font-semibold text-white sm:w-auto md:h-10"
            >
              <Send className="h-4 w-4" />
              {t("linkButton")}
            </Button>
            <p className="text-text-tertiary text-xs">
              {t("telegramConnectHelp")}
            </p>
            {linkError && (
              <p role="alert" className="text-status-negative text-sm">
                {linkError}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Sign out */}
      <div className="pt-2">
        <Button
          variant="ghost"
          className="text-status-negative hover:bg-status-negative/10 hover:text-status-negative h-12 w-full rounded-xl text-[15px] font-semibold md:h-11"
          onClick={async () => {
            if ("caches" in window)
              await clearLegacyCaches(window.caches).catch(() => {});
            await signOut({ callbackUrl: "/auth/signin" });
          }}
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </Button>
      </div>

      {/* Save — floats above the bottom nav while there are unsaved changes */}
      {hasChanges && (
        <div className="animate-page-in sticky bottom-[calc(88px+env(safe-area-inset-bottom))] z-30 md:bottom-6">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-accent-primary hover:bg-accent-hover shadow-fab h-12 w-full rounded-xl text-[15px] font-semibold text-white"
          >
            {isPending ? t("saving") : saved ? t("saved") : t("save")}
          </Button>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <h2 className="text-text-primary mb-1.5 flex items-center gap-2 text-[15px] font-semibold">
      <Icon className="text-text-tertiary h-4 w-4" />
      {children}
    </h2>
  );
}
