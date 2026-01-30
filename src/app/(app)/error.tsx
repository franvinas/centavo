"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <h2 className="text-xl font-semibold text-text-primary">
        Something went wrong
      </h2>
      <p className="text-sm text-text-secondary">
        {error.message || "An unexpected error occurred"}
      </p>
      <Button
        onClick={reset}
        className="bg-accent-primary text-white hover:bg-accent-primary/90"
      >
        Try again
      </Button>
    </div>
  );
}
