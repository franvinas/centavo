import { createApiClient } from "../lib/api";
import { getBooleanOption, getStringOption } from "../lib/helpers";
import { printJson, printTable } from "../lib/output";
import type { CommandSpec } from "../lib/types";

function analyticsOptions(defaultDescription: string) {
  return [
    {
      name: "period",
      description: defaultDescription,
      type: "string" as const,
      placeholder: "preset",
    },
    {
      name: "from",
      description: "Custom range start date.",
      type: "string" as const,
      placeholder: "date",
    },
    {
      name: "to",
      description: "Custom range end date.",
      type: "string" as const,
      placeholder: "date",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean" as const,
    },
  ];
}

function buildQuery(options: Record<string, unknown>) {
  const search = new URLSearchParams();
  for (const key of ["period", "from", "to"] as const) {
    const value = getStringOption(options, key);
    if (value) search.set(key, value);
  }
  return search;
}

const summaryCommand: CommandSpec = {
  name: "summary",
  summary: "Show analytics summary for a period.",
  usage: ["centavo analytics summary [--period this-month]"],
  options: analyticsOptions("Analytics preset, defaults to this-month."),
  run: async (context, input) => {
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const query = buildQuery(input.options);
    const response = await api.request<Record<string, unknown>>(
      `/api/analytics/summary?${query.toString()}`,
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response);
      return 0;
    }

    printTable(
      ["Metric", "Value"],
      [
        ["Period", String(response.periodLabel ?? "")],
        [
          "Total spent",
          String(
            (response.summary as Record<string, unknown>).totalSpent ?? "",
          ),
        ],
        [
          "Transactions",
          String(
            (response.summary as Record<string, unknown>).transactionCount ??
              "",
          ),
        ],
        [
          "Daily average",
          String(
            (response.summary as Record<string, unknown>).dailyAverage ?? "",
          ),
        ],
        ["Base currency", String(response.baseCurrency ?? "")],
      ],
    );
    return 0;
  },
};

const categoriesCommand: CommandSpec = {
  name: "categories",
  summary: "Show spend by category.",
  usage: ["centavo analytics categories [--period this-month]"],
  options: analyticsOptions("Analytics preset, defaults to this-month."),
  run: async (context, input) => {
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const query = buildQuery(input.options);
    const response = await api.request<{
      items: Array<Record<string, unknown>>;
    }>(`/api/analytics/categories?${query.toString()}`);

    if (getBooleanOption(input.options, "json")) {
      printJson(response);
      return 0;
    }

    printTable(
      ["Category", "Count", "Total"],
      response.items.map((item) => [
        String(item.name),
        String(item.count),
        String(item.total),
      ]),
    );
    return 0;
  },
};

const trendCommand: CommandSpec = {
  name: "trend",
  summary: "Show spend over time.",
  usage: ["centavo analytics trend [--period last-12-months]"],
  options: analyticsOptions("Analytics preset, defaults to last-12-months."),
  run: async (context, input) => {
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const query = buildQuery(input.options);
    const response = await api.request<{
      items: Array<Record<string, unknown>>;
    }>(`/api/analytics/trend?${query.toString()}`);

    if (getBooleanOption(input.options, "json")) {
      printJson(response);
      return 0;
    }

    printTable(
      ["Period", "Total"],
      response.items.map((item) => [String(item.period), String(item.total)]),
    );
    return 0;
  },
};

const currenciesCommand: CommandSpec = {
  name: "currencies",
  summary: "Show spend by original currency.",
  usage: ["centavo analytics currencies [--period this-month]"],
  options: analyticsOptions("Analytics preset, defaults to this-month."),
  run: async (context, input) => {
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const query = buildQuery(input.options);
    const response = await api.request<{
      items: Array<Record<string, unknown>>;
    }>(`/api/analytics/currencies?${query.toString()}`);

    if (getBooleanOption(input.options, "json")) {
      printJson(response);
      return 0;
    }

    printTable(
      ["Currency", "Count", "Original Total", "Base Total"],
      response.items.map((item) => [
        String(item.currency),
        String(item.count),
        String(item.originalTotal),
        String(item.baseTotal),
      ]),
    );
    return 0;
  },
};

export const analyticsCommand: CommandSpec = {
  name: "analytics",
  summary: "View analytics in the terminal.",
  usage: [
    "centavo analytics summary",
    "centavo analytics categories",
    "centavo analytics trend",
    "centavo analytics currencies",
  ],
  subcommands: [
    summaryCommand,
    categoriesCommand,
    trendCommand,
    currenciesCommand,
  ],
};
