import { describe, expect, it, vi } from "vitest";
import {
  clearLegacyCaches,
  isPublicAsset,
  PUBLIC_CACHE_PREFIX,
} from "../cache-privacy";
const origin = "https://centavo.vercel.app";
describe("cache privacy", () => {
  it.each([
    "/api/expenses",
    "/api/user",
    "/dashboard",
    "/expenses?_rsc=abc",
    "/_next/data/build/dashboard.json",
    "/_next/image?url=avatar",
    "/auth/signin",
  ])("never caches %s", (path) => {
    expect(isPublicAsset(new URL(path, origin), origin)).toBe(false);
  });
  it.each([
    "/_next/static/chunks/app.js",
    "/icons/icon-192.png",
    "/manifest.webmanifest",
  ])("allows public asset %s", (path) => {
    expect(isPublicAsset(new URL(path, origin), origin)).toBe(true);
  });
  it("does not cache external assets under a public-looking path", () => {
    expect(
      isPublicAsset(
        new URL("https://external.example/icons/avatar.png"),
        origin,
      ),
    ).toBe(false);
  });
  it("removes previous users' API, HTML, RSC and unknown caches on upgrade/logout", async () => {
    const keep = `${PUBLIC_CACHE_PREFIX}-precache-v2`;
    const storage = {
      keys: vi
        .fn()
        .mockResolvedValue([
          "apis",
          "pages",
          "pages-rsc",
          "next-data",
          "others",
          "static-image-assets",
          "serwist-precache-v2-old",
          keep,
          `${PUBLIC_CACHE_PREFIX}-assets`,
        ]),
      delete: vi.fn().mockResolvedValue(true),
    };
    await clearLegacyCaches(storage);
    expect(storage.delete).toHaveBeenCalledTimes(7);
    expect(storage.delete).toHaveBeenCalledWith("apis");
    expect(storage.delete).toHaveBeenCalledWith("pages-rsc");
    expect(storage.delete).not.toHaveBeenCalledWith(keep);
    expect(storage.delete).not.toHaveBeenCalledWith(
      `${PUBLIC_CACHE_PREFIX}-assets`,
    );
  });
});
