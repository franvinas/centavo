import { z } from "zod/v4";
import { locales } from "@/i18n/config";

export const completeOnboardingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  baseCurrency: z.string().length(3).toUpperCase(),
  locale: z.enum(locales),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
