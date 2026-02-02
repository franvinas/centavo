export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a date string as a local date. ISO strings like
 * "2025-02-02T00:00:00.000Z" are UTC, which shifts the day
 * backwards in negative-offset timezones. This extracts the
 * year/month/day components and constructs a local Date.
 */
export function parseLocalDate(dateString: string): Date {
  const d = new Date(dateString);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function diffInDays(dateString: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = parseLocalDate(dateString);
  return Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function formatRelativeDate(dateString: string): string {
  const days = diffInDays(dateString);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const date = parseLocalDate(dateString);
  const now = new Date();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatDateGroup(dateString: string): string {
  const days = diffInDays(dateString);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";

  const date = parseLocalDate(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
