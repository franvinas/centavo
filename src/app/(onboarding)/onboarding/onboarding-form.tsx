"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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
    startTransition(async () => {
      await completeOnboarding({
        name: name.trim(),
        baseCurrency: currency,
        locale,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="animate-page-in w-full max-w-sm">
      <div className="flex flex-col items-center">
        <Image
          src="/icons/centavo-logo.svg"
          alt="Centavo"
          width={56}
          height={56}
          className="rounded-xl"
        />

        <h1 className="text-text-primary mt-5 text-center text-[26px] leading-tight font-semibold tracking-tight">
          {copy.title}
        </h1>
        <p className="text-text-secondary mt-1 text-center text-base">
          {copy.subtitle}
        </p>

        <div className="bg-bg-surface shadow-card border-border-subtle/60 mt-7 w-full rounded-3xl border p-6">
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
                className="border-border-subtle bg-bg-primary text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:ring-ring/30 h-12 w-full rounded-xl border px-4 text-base transition-shadow focus:ring-[3px] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-text-primary text-sm font-semibold">
                {copy.languageLabel}
              </label>
              <p className="text-text-tertiary text-[13px]">
                {copy.languageHint}
              </p>
              <div className="bg-bg-muted grid grid-cols-2 gap-1 rounded-xl p-1">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocale(loc)}
                    aria-pressed={locale === loc}
                    className={`h-9 rounded-[10px] text-sm font-semibold transition-all ${
                      locale === loc
                        ? "bg-bg-surface text-text-primary shadow-subtle"
                        : "text-text-tertiary hover:text-text-secondary"
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
              <div className="bg-bg-muted grid grid-cols-3 gap-1 rounded-xl p-1">
                {CURRENCIES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCurrency(code)}
                    aria-pressed={currency === code}
                    className={`h-9 rounded-[10px] text-sm font-semibold transition-all ${
                      currency === code
                        ? "bg-bg-surface text-text-primary shadow-subtle"
                        : "text-text-tertiary hover:text-text-secondary"
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
          className="bg-accent-primary hover:bg-accent-hover shadow-fab mt-6 h-[52px] w-full rounded-xl text-base font-semibold text-white transition-all active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
        >
          {isPending ? copy.submitting : copy.submit}
        </button>
      </div>
    </form>
  );
}
