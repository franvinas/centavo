export const PUBLIC_CACHE_PREFIX = "centavo-public-v1";

export function isPublicAsset(url: URL, origin: string): boolean {
  if (url.origin !== origin) return false;
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    ["/favicon.ico", "/apple-icon.png", "/manifest.webmanifest"].includes(
      url.pathname,
    )
  );
}

export async function clearLegacyCaches(
  storage: Pick<CacheStorage, "keys" | "delete">,
) {
  const names = await storage.keys();
  await Promise.all(
    names
      .filter((name) => !name.startsWith(`${PUBLIC_CACHE_PREFIX}-`))
      .map((name) => storage.delete(name)),
  );
}
