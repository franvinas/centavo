import { createApiClient } from "../lib/api";
import { getBooleanOption, getStringOption, printUserSettings } from "./shared";
import { printJson } from "../lib/output";
import type { CommandSpec } from "../lib/types";

const showCommand: CommandSpec = {
  name: "show",
  summary: "Show profile and preference settings.",
  usage: ["centavo settings show [--json]"],
  options: [
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  run: async (context, input) => {
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{ user: Record<string, unknown> }>(
      "/api/user",
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response.user);
      return 0;
    }

    printUserSettings(response.user);
    return 0;
  },
};

const setCommand: CommandSpec = {
  name: "set",
  summary: "Update profile or preference fields.",
  usage: [
    "centavo settings set --name <name>",
    "centavo settings set --base-currency <code>",
  ],
  options: [
    {
      name: "name",
      description: "Update the display name.",
      type: "string",
      placeholder: "name",
    },
    {
      name: "base-currency",
      description: "Update the base currency.",
      type: "string",
      placeholder: "code",
    },
    {
      name: "locale",
      description: "Update the locale.",
      type: "string",
      placeholder: "en|es",
    },
    {
      name: "timezone",
      description: "Update the timezone.",
      type: "string",
      placeholder: "iana-tz",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  examples: [
    "centavo settings set --name Fran",
    "centavo settings set --base-currency ARS --locale es",
  ],
  run: async (context, input) => {
    const payload: Record<string, string> = {};
    const name = getStringOption(input.options, "name");
    const baseCurrency = getStringOption(input.options, "base-currency");
    const locale = getStringOption(input.options, "locale");
    const timezone = getStringOption(input.options, "timezone");

    if (name) payload.name = name;
    if (baseCurrency) payload.baseCurrency = baseCurrency;
    if (locale) payload.locale = locale;
    if (timezone) payload.timezone = timezone;

    if (Object.keys(payload).length === 0) {
      throw new Error("Provide at least one field to update.");
    }

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{ user: Record<string, unknown> }>(
      "/api/user",
      {
        method: "PUT",
        json: payload,
      },
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response.user);
      return 0;
    }

    printUserSettings(response.user);
    return 0;
  },
};

export const settingsCommand: CommandSpec = {
  name: "settings",
  summary: "Show or update Centavo settings.",
  usage: ["centavo settings show", "centavo settings set [options]"],
  subcommands: [showCommand, setCommand],
};
