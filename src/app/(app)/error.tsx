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
      <h2 className="text-text-primary text-xl font-semibold">
        Something went wrong
      </h2>
      <p className="text-text-secondary text-sm">
        {error.message || "An unexpected error occurred"}
      </p>
      <Button
        onClick={reset}
        className="bg-accent-primary hover:bg-accent-primary/90 text-white"
      >
        Try again
      </Button>
    </div>
  );
}
