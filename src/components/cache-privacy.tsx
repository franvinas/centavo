"use client";
import { useEffect } from "react";
import { clearLegacyCaches } from "@/lib/cache-privacy";

export function CachePrivacy() {
  useEffect(() => {
    if ("caches" in window)
      void clearLegacyCaches(window.caches).catch(() => {});
  }, []);
  return null;
}
