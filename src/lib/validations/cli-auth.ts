import { z } from "zod/v4";

export const createCliAuthRequestSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});

export const cliAuthRequestCodeSchema = z.object({
  code: z.string().trim().min(1, "Auth request code is required"),
});

export const consumeCliAuthRequestSchema = cliAuthRequestCodeSchema.extend({
  name: z.string().trim().min(1).max(100).optional(),
});

export type CreateCliAuthRequestInput = z.infer<
  typeof createCliAuthRequestSchema
>;
export type ConsumeCliAuthRequestInput = z.infer<
  typeof consumeCliAuthRequestSchema
>;
