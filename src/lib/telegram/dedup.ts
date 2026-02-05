const seen = new Map<number, number>();

const TTL = 5 * 60 * 1000; // 5 minutes

export function isDuplicate(updateId: number): boolean {
  const now = Date.now();

  // Prune stale entries
  for (const [id, timestamp] of seen) {
    if (now - timestamp > TTL) {
      seen.delete(id);
    }
  }

  if (seen.has(updateId)) {
    return true;
  }

  seen.set(updateId, now);
  return false;
}
