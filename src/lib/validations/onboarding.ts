import { z } from "zod/v4";

export const completeOnboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  baseCurrency: z.string().length(3).toUpperCase(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
