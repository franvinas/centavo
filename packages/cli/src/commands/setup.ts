import { createApiClient } from "../lib/api";
import { prompt } from "../lib/io";
import {
  getBooleanOption,
  getCurrentUser,
  getStringOption,
} from "../lib/helpers";
import { printJson } from "../lib/output";
import type { CommandSpec } from "../lib/types";

export const setupCommand: CommandSpec = {
  name: "setup",
  summary: "Complete first-time account setup.",
  usage: [
    "centavo setup [--name <name>] [--base-currency <code>] [--locale <en|es>]",
  ],
  options: [
    {
      name: "name",
      description: "Display name to save.",
      type: "string",
      placeholder: "name",
    },
    {
      name: "base-currency",
      description: "Base currency to save.",
      type: "string",
      placeholder: "code",
    },
    {
      name: "locale",
      description: "Locale to use for defaults and UI.",
      type: "string",
      placeholder: "en|es",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  examples: [
    "centavo setup --name Fran --base-currency ARS --locale es",
    "centavo setup",
  ],
  run: async (context, input) => {
    const currentUser = await getCurrentUser(context.baseUrl);
    const name =
      getStringOption(input.options, "name") ||
      (await prompt(`Display name [${currentUser.name ?? ""}]: `)) ||
      currentUser.name ||
      "";
    const baseCurrency =
      getStringOption(input.options, "base-currency") ||
      (await prompt(`Base currency [${currentUser.baseCurrency}]: `)) ||
      currentUser.baseCurrency;
    const locale =
      getStringOption(input.options, "locale") ||
      (await prompt(`Locale [${currentUser.locale}]: `)) ||
      currentUser.locale;

    if (!name.trim()) {
      throw new Error("Display name is required.");
    }

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{ user: Record<string, unknown> }>(
      "/api/setup",
      {
        method: "POST",
        json: {
          name,
          baseCurrency,
          locale,
        },
      },
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response.user);
      return 0;
    }

    process.stdout.write(
      `Setup complete for ${String(response.user.email)}.\n`,
    );
    return 0;
  },
};
