import { z } from "zod/v4";

export const MAX_TAG_LENGTH = 30;
export const MAX_TAGS_PER_EXPENSE = 10;

/** Trim, lowercase, drop a leading "#" and collapse inner whitespace. */
export function normalizeTagName(value: string) {
  return value
    .trim()
    .replace(/^#+/, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Split a "a, b; c" string (CSV cells, query params) into raw tag names. */
export function splitTagList(value: string) {
  return value.split(/[,;]/);
}

export const tagNameSchema = z
  .string()
  .transform(normalizeTagName)
  .pipe(
    z
      .string()
      .min(1, "Tag name is required")
      .max(MAX_TAG_LENGTH, `Tags must be under ${MAX_TAG_LENGTH} characters`),
  );

function toTagArray(value: unknown) {
  if (typeof value !== "string") return value;
  return splitTagList(value).filter(
    (item) => item.trim() && item.trim() !== "#",
  );
}

/**
 * Tag list accepted on expenses: an array or a "a, b; c" string.
 * Normalized and de-duplicated, preserving the first-seen order.
 */
export const tagListSchema = z.preprocess(
  toTagArray,
  z
    .array(tagNameSchema)
    .transform((tags) => [...new Set(tags)])
    .pipe(
      z
        .array(z.string())
        .max(
          MAX_TAGS_PER_EXPENSE,
          `An expense can have at most ${MAX_TAGS_PER_EXPENSE} tags`,
        ),
    ),
);

/** Tag filter: OR semantics, empty means "no filter". */
export const tagFilterSchema = z.preprocess(
  toTagArray,
  z.array(tagNameSchema).transform((tags) => [...new Set(tags)]),
);

export function parseTagFilter(value: string | string[] | null | undefined) {
  if (value == null) return undefined;
  const joined = Array.isArray(value) ? value.join(",") : value;
  const parsed = tagFilterSchema.safeParse(joined);
  return parsed.success && parsed.data.length > 0 ? parsed.data : undefined;
}

export const renameTagSchema = z.object({ name: tagNameSchema });

export type RenameTagInput = z.infer<typeof renameTagSchema>;
