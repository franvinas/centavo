import fs from "node:fs/promises";
import { createApiClient } from "./api";
import { confirm, prompt } from "./io";

interface CategoryRecord {
  id: string;
  name: string;
  color?: string;
  icon?: string | null;
  _count?: { expenses: number };
}

export interface UserRecord {
  id: string;
  email: string;
  name?: string | null;
  baseCurrency: string;
  locale: string;
  timezone?: string | null;
  telegramChatId?: string | null;
}

export function getStringOption(
  options: Record<string, unknown>,
  name: string,
) {
  const value = options[name];
  return typeof value === "string" ? value : undefined;
}

export function getNumberOption(
  options: Record<string, unknown>,
  name: string,
) {
  const value = options[name];
  return typeof value === "number" ? value : undefined;
}

export function getBooleanOption(
  options: Record<string, unknown>,
  name: string,
) {
  return options[name] === true;
}

export function getStringArrayOption(
  options: Record<string, unknown>,
  name: string,
) {
  const value = options[name];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

export function requirePositional(
  positionals: string[],
  index: number,
  label: string,
) {
  const value = positionals[index];
  if (!value) {
    throw new Error(`Missing required argument: ${label}`);
  }
  return value;
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function getCurrentUser(baseUrl?: string) {
  const api = await createApiClient({ baseUrl });
  const response = await api.request<{ user: UserRecord }>("/api/user");
  return response.user;
}

export async function listCategories(baseUrl?: string) {
  const api = await createApiClient({ baseUrl });
  const response = await api.request<{ categories: CategoryRecord[] }>(
    "/api/categories",
  );
  return response.categories;
}

export async function resolveCategoryId(value: string, baseUrl?: string) {
  const categories = await listCategories(baseUrl);

  const exactId = categories.find((category) => category.id === value);
  if (exactId) return exactId.id;

  const normalized = value.trim().toLowerCase();
  const exactName = categories.find(
    (category) => category.name.trim().toLowerCase() === normalized,
  );

  if (!exactName) {
    throw new Error(`Category not found: ${value}`);
  }

  return exactName.id;
}

export async function resolveOptionalCategoryId(
  value: string | undefined,
  baseUrl?: string,
) {
  if (!value) return undefined;
  return resolveCategoryId(value, baseUrl);
}

export function readIdsOption(options: Record<string, unknown>) {
  const ids = getStringOption(options, "ids");
  return ids
    ? ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : undefined;
}

export function buildSelectorPayload(
  options: Record<string, unknown>,
  overrides: { ids?: string[] } = {},
) {
  const selectors: Record<string, unknown> = {};
  const ids = overrides.ids ?? readIdsOption(options);
  if (ids?.length) selectors.ids = ids;

  for (const key of ["search", "from", "to", "before", "after"] as const) {
    const value = getStringOption(options, key);
    if (value) selectors[key] = value;
  }

  return selectors;
}

export async function maybeConfirm(message: string, skipConfirmation: boolean) {
  if (skipConfirmation) return true;
  return confirm(message);
}

export async function ensureValue(value: string | undefined, message: string) {
  if (value) return value;
  const answer = await prompt(message);
  if (!answer) throw new Error(message.trim());
  return answer;
}

export async function readInputFile(
  filePath: string | undefined,
  fromStdin: boolean,
) {
  if (fromStdin) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf8");
  }

  if (!filePath) {
    throw new Error("Provide --file <path> or --stdin");
  }

  return fs.readFile(filePath, "utf8");
}
