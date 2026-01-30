"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { updateUser } from "@/lib/actions/user";

const CURRENCIES = ["USD", "EUR", "ARS"];

interface SettingsClientProps {
  user: {
    name: string;
    email: string;
    baseCurrency: string;
  };
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name);
  const [baseCurrency, setBaseCurrency] = useState(user.baseCurrency);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateUser({ name, baseCurrency });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const hasChanges = name !== user.name || baseCurrency !== user.baseCurrency;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-semibold">Settings</h1>
        <p className="text-text-secondary mt-1 text-sm">Manage your account</p>
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
          Base Currency
        </h2>
        <p className="text-text-secondary mb-4 text-sm">
          All expenses are converted to this currency for totals.
        </p>
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

      {/* Save */}
      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-accent-primary hover:bg-accent-primary/90 w-full text-white"
        >
          {isPending ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      )}

      <Separator className="bg-border-subtle" />

      {/* Sign out */}
      <Button
        variant="outline"
        className="border-status-negative text-status-negative hover:bg-status-negative/10 w-full"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
