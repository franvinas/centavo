import { createApiClient } from "../lib/api";
import { getBooleanOption } from "../lib/helpers";
import { openBrowser } from "../lib/io";
import { printJson } from "../lib/output";
import type { CommandSpec } from "../lib/types";

const linkCommand: CommandSpec = {
  name: "link",
  summary: "Create a Telegram link token.",
  usage: ["centavo telegram link [--open] [--json]"],
  options: [
    {
      name: "open",
      description: "Open the Telegram deep link.",
      type: "boolean",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  run: async (context, input) => {
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<Record<string, unknown>>(
      "/api/telegram/link",
      {
        method: "POST",
      },
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response);
      return 0;
    }

    process.stdout.write(`${String(response.url)}\n`);
    if (getBooleanOption(input.options, "open")) {
      await openBrowser(String(response.url));
    }
    return 0;
  },
};

const unlinkCommand: CommandSpec = {
  name: "unlink",
  summary: "Unlink the Telegram account.",
  usage: ["centavo telegram unlink"],
  run: async (context) => {
    const api = await createApiClient({ baseUrl: context.baseUrl });
    await api.request("/api/telegram/link", { method: "DELETE" });
    process.stdout.write("Telegram unlinked.\n");
    return 0;
  },
};

export const telegramCommand: CommandSpec = {
  name: "telegram",
  summary: "Manage Telegram integration.",
  usage: ["centavo telegram link", "centavo telegram unlink"],
  subcommands: [linkCommand, unlinkCommand],
};
