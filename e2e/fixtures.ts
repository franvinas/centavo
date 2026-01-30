import { test as base } from "@playwright/test";

// Dev mode auth: middleware is disabled and getCurrentUser falls back to first DB user.
// No login step needed.
export const test = base.extend({});

export { expect } from "@playwright/test";
