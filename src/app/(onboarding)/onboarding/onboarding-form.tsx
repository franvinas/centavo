"use client";

import { useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { completeOnboarding } from "@/lib/actions/onboarding";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN", "BRL"];

export function OnboardingForm() {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      completeOnboarding({ name: name.trim(), baseCurrency: currency });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="flex flex-col items-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent-light">
          <Wallet className="h-8 w-8 text-accent-primary" />
        </div>

        <h1 className="mt-4 text-center text-[28px] font-bold leading-tight text-text-primary">
          Welcome to Centavo
        </h1>
        <p className="mt-1 text-center text-base text-text-secondary">
          Let&apos;s set up your account
        </p>

        <div className="mt-6 w-full rounded-2xl bg-bg-surface p-6 shadow-card">
          <div className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-semibold text-text-primary"
              >
                What should we call you?
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-12 w-full rounded-xl border border-border-subtle bg-bg-primary px-4 text-base text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary">
                Base currency
              </label>
              <p className="text-[13px] text-text-tertiary">
                All expenses will be converted to this currency
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
                        : "border border-border-subtle bg-bg-primary text-text-primary"
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
          className="mt-6 h-[52px] w-full rounded-[14px] bg-accent-primary text-base font-semibold text-white shadow-fab transition-opacity disabled:opacity-50"
        >
          {isPending ? "Setting up..." : "Get Started"}
        </button>
      </div>
    </form>
  );
}
