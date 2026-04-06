"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

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
      <div className="bg-bg-surface shadow-card rounded-lg p-6 text-center">
        <h1 className="text-text-primary text-xl font-semibold">
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
    <div className="bg-bg-surface shadow-card rounded-lg p-6">
      <h1 className="text-text-primary text-xl font-semibold">
        Approve CLI Login
      </h1>
      <p className="text-text-secondary mt-2 text-sm">
        This will authorize a Centavo CLI session on the device that started
        this login request.
      </p>
      {error ? (
        <p role="alert" className="text-status-negative mt-4 text-sm">
          {error}
        </p>
      ) : null}
      <Button
        onClick={handleApprove}
        disabled={isPending}
        className="bg-accent-primary hover:bg-accent-primary/90 mt-6 w-full text-white"
      >
        {isPending ? "Approving..." : "Approve Login"}
      </Button>
    </div>
  );
}
