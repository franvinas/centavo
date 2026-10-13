import { z } from "zod/v4";
import { locales } from "@/i18n/config";
import { CURRENCIES } from "@/lib/constants";

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  baseCurrency: z
    .string()
    .length(3)
    .toUpperCase()
    .refine((currency) => CURRENCIES.includes(currency), "Unsupported currency")
    .optional(),
  locale: z.enum(locales).optional(),
  timezone: z.string().min(1).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
