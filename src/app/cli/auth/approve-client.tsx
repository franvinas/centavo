"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TerminalSquare } from "lucide-react";

interface CliAuthApproveClientProps {
  requestId: string;
  code: string;
}

export function CliAuthApproveClient({
  requestId,
  code,
}: CliAuthApproveClientProps) {
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setError("");

    startTransition(async () => {
      const res = await fetch(`/api/cli/auth/requests/${requestId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        setApproved(true);
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Failed to approve CLI sign-in");
    });
  }

  if (approved) {
    return (
      <div className="bg-bg-surface shadow-card border-border-subtle/60 rounded-3xl border p-6 text-center">
        <div className="bg-accent-soft mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
          <CheckCircle2 className="text-accent-primary h-6 w-6" />
        </div>
        <h1 className="text-text-primary text-lg font-semibold">
          CLI Login Approved
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          You can return to your terminal. Centavo CLI should finish signing in
          within a few seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface shadow-card border-border-subtle/60 rounded-3xl border p-6 text-center">
      <div className="bg-accent-soft mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
        <TerminalSquare className="text-accent-primary h-6 w-6" />
      </div>
      <h1 className="text-text-primary text-lg font-semibold">
        Approve CLI Login
      </h1>
      <p className="text-text-secondary mt-2 text-sm">
        This will authorize a Centavo CLI session on the device that started
        this login request.
      </p>
      {error ? (
        <p
          role="alert"
          className="bg-status-negative/10 text-status-negative mt-4 rounded-xl px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}
      <Button
        onClick={handleApprove}
        disabled={isPending}
        className="bg-accent-primary hover:bg-accent-hover mt-6 h-12 w-full rounded-xl text-[15px] font-semibold text-white md:h-11"
      >
        {isPending ? "Approving..." : "Approve Login"}
      </Button>
    </div>
  );
}
