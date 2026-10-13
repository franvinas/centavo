import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  Serwist,
  CacheFirst,
  NetworkOnly,
  ExpirationPlugin,
  setCacheNameDetails,
} from "serwist";
import {
  PUBLIC_CACHE_PREFIX,
  isPublicAsset,
  clearLegacyCaches,
} from "@/lib/cache-privacy";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

setCacheNameDetails({ prefix: PUBLIC_CACHE_PREFIX });

const serwist = new Serwist({
  precacheEntries: (self.__SW_MANIFEST ?? []).filter((entry) =>
    isPublicAsset(
      new URL(
        typeof entry === "string" ? entry : entry.url,
        self.location.origin,
      ),
      self.location.origin,
    ),
  ),
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => isPublicAsset(url, self.location.origin),
      handler: new CacheFirst({
        cacheName: `${PUBLIC_CACHE_PREFIX}-assets`,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 128,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    // Authenticated HTML, RSC, API responses and avatars always go to the network.
    {
      matcher: () => true,
      handler: new NetworkOnly({
        plugins: [
          {
            requestWillFetch: async ({ request }) =>
              new Request(request, { cache: "no-store" }),
          },
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
self.addEventListener("activate", (event) =>
  event.waitUntil(clearLegacyCaches(self.caches)),
);
