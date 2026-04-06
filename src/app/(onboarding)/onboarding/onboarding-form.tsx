"use client";

import { useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { CURRENCIES } from "@/lib/constants";
import { locales, type Locale } from "@/i18n/config";
import enMessages from "@/messages/en.json";
import esMessages from "@/messages/es.json";

interface OnboardingFormProps {
  initialName?: string;
  initialCurrency?: string;
  initialLocale?: Locale;
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

const ONBOARDING_MESSAGES = {
  en: enMessages.onboarding,
  es: esMessages.onboarding,
} as const satisfies Record<Locale, typeof enMessages.onboarding>;

export function OnboardingForm({
  initialName = "",
  initialCurrency = "USD",
  initialLocale = "en",
}: OnboardingFormProps) {
  const [name, setName] = useState(initialName);
  const [currency, setCurrency] = useState(initialCurrency);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();
  const copy = ONBOARDING_MESSAGES[locale];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      completeOnboarding({
        name: name.trim(),
        baseCurrency: currency,
        locale,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="flex flex-col items-center">
        <div className="bg-accent-light flex h-[72px] w-[72px] items-center justify-center rounded-full">
          <Wallet className="text-accent-primary h-8 w-8" />
        </div>

        <h1 className="text-text-primary mt-4 text-center text-[28px] leading-tight font-bold">
          {copy.title}
        </h1>
        <p className="text-text-secondary mt-1 text-center text-base">
          {copy.subtitle}
        </p>

        <div className="bg-bg-surface shadow-card mt-6 w-full rounded-lg p-5">
          <div className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-text-primary text-sm font-semibold"
              >
                {copy.nameLabel}
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={copy.namePlaceholder}
                autoComplete="name"
                className="border-border-subtle bg-bg-primary text-text-primary placeholder:text-text-tertiary focus:border-accent-primary h-12 w-full rounded-xl border px-4 text-base focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-text-primary text-sm font-semibold">
                {copy.languageLabel}
              </label>
              <p className="text-text-tertiary text-[13px]">
                {copy.languageHint}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocale(loc)}
                    className={`h-10 rounded-full text-sm font-medium transition-colors ${
                      locale === loc
                        ? "bg-accent-primary font-semibold text-white"
                        : "border-border-subtle bg-bg-primary text-text-primary border"
                    }`}
                  >
                    {LOCALE_LABELS[loc]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-text-primary text-sm font-semibold">
                {copy.currencyLabel}
              </label>
              <p className="text-text-tertiary text-[13px]">
                {copy.currencyHint}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCurrency(code)}
                    className={`h-10 rounded-full text-sm font-medium transition-colors ${
                      currency === code
                        ? "bg-accent-primary font-semibold text-white"
                        : "border-border-subtle bg-bg-primary text-text-primary border"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="bg-accent-primary shadow-fab mt-6 h-[52px] w-full rounded-[14px] text-base font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {isPending ? copy.submitting : copy.submit}
        </button>
      </div>
    </form>
  );
}
