import { z } from "zod/v4";
import { PERIOD_PRESETS } from "@/lib/analytics-periods";

const periodKeys = PERIOD_PRESETS.map((preset) => preset.key) as [
  string,
  ...string[],
];

export const analyticsQuerySchema = z.object({
  period: z.enum(periodKeys).optional(),
  from: z.string().date("Invalid from date").optional(),
  to: z.string().date("Invalid to date").optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
