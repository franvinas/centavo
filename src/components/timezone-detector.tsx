"use client";

import { useEffect } from "react";

export function TimezoneDetector({
  currentTimezone,
}: {
  currentTimezone: string | null;
}) {
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && detected !== currentTimezone) {
      fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: detected }),
      }).catch(() => {
        // Silently fail — will retry on next page load
      });
    }
  }, [currentTimezone]);

  return null;
}
