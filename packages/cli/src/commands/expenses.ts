import fs from "node:fs/promises";
import { createApiClient } from "../lib/api";
import { parseCsv, stringifyCsv } from "../lib/csv";
import {
  buildSelectorPayload,
  formatMoney,
  getBooleanOption,
  getCurrentUser,
  getNumberOption,
  getStringArrayOption,
  getStringOption,
  maybeConfirm,
  readInputFile,
  resolveCategoryId,
  resolveOptionalCategoryId,
} from "../lib/helpers";
import { printJson, printKeyValue, printTable } from "../lib/output";
import type { CommandSpec, ParsedCommandInput } from "../lib/types";

interface ExpenseRecord {
  id: string;
  amount: number | string;
  currency: string;
  baseAmount: number | string;
  description: string;
  date: string;
  notes?: string | null;
  category?: {
    id: string;
    name: string;
  };
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

async function previewAndConfirm(
  baseUrl: string | undefined,
  endpoint: string,
  payload: Record<string, unknown>,
  json: boolean,
  yes: boolean,
) {
  const api = await createApiClient({ baseUrl });
  const preview = await api.request<Record<string, unknown>>(endpoint, {
    method: "POST",
    json: { ...payload, preview: true },
  });

  if (json) {
    printJson(preview);
  } else {
    process.stdout.write(
      `Matched ${String(preview.matched ?? 0)} expense(s).\n`,
    );
  }

  if (getBooleanOption({ preview: payload.preview }, "preview")) {
    return false;
  }

  return maybeConfirm("Proceed with this change?", yes);
}

async function parseImportItems(
  format: string,
  file: string | undefined,
  fromStdin: boolean,
) {
  const raw = await readInputFile(file, fromStdin);

  if (format === "jsonl") {
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, string>);
  }

  if (format === "csv") {
    return parseCsv(raw);
  }

  throw new Error(`Unsupported import format: ${format}`);
}

function mapExpenseRow(expense: ExpenseRecord) {
  return {
    id: expense.id,
    date: String(expense.date).slice(0, 10),
    description: expense.description,
    category: expense.category?.name ?? "",
    amount: formatMoney(toNumber(expense.amount), expense.currency),
    baseAmount: String(expense.baseAmount),
  };
}

function printExpenses(expenses: ExpenseRecord[]) {
  printTable(
    ["ID", "Date", "Description", "Category", "Amount", "Base"],
    expenses.map((expense) => {
      const row = mapExpenseRow(expense);
      return [
        row.id,
        row.date,
        row.description,
        row.category,
        row.amount,
        row.baseAmount,
      ];
    }),
  );
}

async function buildEditPayload(
  input: ParsedCommandInput,
  baseUrl: string | undefined,
) {
  const ids = input.positionals[0] ? [input.positionals[0]] : undefined;
  const data: Record<string, unknown> = {};

  for (const key of [
    "amount",
    "currency",
    "description",
    "date",
    "notes",
  ] as const) {
    const value =
      key === "amount"
        ? getNumberOption(input.options, key)
        : getStringOption(input.options, key);
    if (value !== undefined) data[key] = value;
  }

  const categoryValue = getStringOption(input.options, "category");
  if (ids?.length && categoryValue) {
    data.categoryId = await resolveCategoryId(categoryValue, baseUrl);
  }

  for (const setValue of getStringArrayOption(input.options, "set")) {
    const [field, rawValue] = setValue.split("=", 2);
    if (!field || rawValue === undefined) {
      throw new Error(`Invalid --set value: ${setValue}`);
    }

    if (field === "category") {
      data.categoryId = await resolveCategoryId(rawValue, baseUrl);
    } else if (field === "amount") {
      data.amount = Number(rawValue);
    } else if (field === "clear-notes") {
      data.clearNotes = rawValue === "true";
    } else {
      data[field] = rawValue;
    }
  }

  if (getBooleanOption(input.options, "clear-notes")) {
    data.clearNotes = true;
  }

  if (!ids?.length && categoryValue) {
    const selectors = buildSelectorPayload(input.options);
    selectors.categoryId = await resolveCategoryId(categoryValue, baseUrl);
    return { selectors, data };
  }

  return {
    selectors: buildSelectorPayload(input.options, ids ? { ids } : {}),
    data,
  };
}

const addCommand: CommandSpec = {
  name: "add",
  summary: "Add an expense.",
  usage: [
    "centavo expense add --amount <amount> --description <text> --category <category>",
  ],
  options: [
    {
      name: "amount",
      description: "Expense amount.",
      type: "number",
      placeholder: "amount",
    },
    {
      name: "currency",
      description: "Original currency code.",
      type: "string",
      placeholder: "code",
    },
    {
      name: "description",
      description: "Expense description.",
      type: "string",
      placeholder: "text",
    },
    {
      name: "category",
      description: "Category ID or exact name.",
      type: "string",
      placeholder: "category",
    },
    {
      name: "date",
      description: "Expense date in YYYY-MM-DD.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "notes",
      description: "Optional notes.",
      type: "string",
      placeholder: "text",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  examples: [
    "centavo expense add --amount 12.50 --description Coffee --category Food",
  ],
  run: async (context, input) => {
    const amount = getNumberOption(input.options, "amount");
    const description = getStringOption(input.options, "description");
    const categoryValue = getStringOption(input.options, "category");

    if (amount === undefined || !description || !categoryValue) {
      throw new Error("--amount, --description, and --category are required.");
    }

    const currentUser = await getCurrentUser(context.baseUrl);
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{ expense: ExpenseRecord }>(
      "/api/expenses",
      {
        method: "POST",
        json: {
          amount,
          currency:
            getStringOption(input.options, "currency") ??
            currentUser.baseCurrency,
          description,
          categoryId: await resolveCategoryId(categoryValue, context.baseUrl),
          date:
            getStringOption(input.options, "date") ??
            new Date().toISOString().slice(0, 10),
          notes: getStringOption(input.options, "notes"),
        },
      },
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response.expense);
      return 0;
    }

    process.stdout.write(`Created expense ${response.expense.id}.\n`);
    return 0;
  },
};

const listCommand: CommandSpec = {
  name: "list",
  summary: "List expenses.",
  usage: [
    "centavo expense list [--search <text>] [--from <date>] [--to <date>]",
  ],
  options: [
    {
      name: "search",
      description: "Search descriptions.",
      type: "string",
      placeholder: "text",
    },
    {
      name: "category",
      description: "Filter by category ID or exact name.",
      type: "string",
      placeholder: "category",
    },
    {
      name: "from",
      description: "Filter from date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "to",
      description: "Filter to date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "page",
      description: "Page number.",
      type: "number",
      placeholder: "n",
    },
    {
      name: "limit",
      description: "Page size.",
      type: "number",
      placeholder: "n",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  run: async (context, input) => {
    const categoryId = await resolveOptionalCategoryId(
      getStringOption(input.options, "category"),
      context.baseUrl,
    );
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const search = new URLSearchParams();

    for (const key of ["search", "from", "to"] as const) {
      const value = getStringOption(input.options, key);
      if (value) search.set(key, value);
    }
    if (categoryId) search.set("categoryId", categoryId);
    const page = getNumberOption(input.options, "page");
    const limit = getNumberOption(input.options, "limit");
    if (page !== undefined) search.set("page", String(page));
    if (limit !== undefined) search.set("limit", String(limit));

    const response = await api.request<{
      expenses: ExpenseRecord[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/expenses?${search.toString()}`, {
      method: "GET",
    });

    if (getBooleanOption(input.options, "json")) {
      printJson(response);
      return 0;
    }

    process.stdout.write(`Found ${response.total} expense(s).\n`);
    printExpenses(response.expenses);
    return 0;
  },
};

const showCommand: CommandSpec = {
  name: "show",
  summary: "Show one expense.",
  usage: ["centavo expense show <expense-id> [--json]"],
  options: [
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  run: async (context, input) => {
    const id = input.positionals[0];
    if (!id) throw new Error("Expense ID is required.");

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{ expense: ExpenseRecord }>(
      `/api/expenses/${id}`,
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response.expense);
      return 0;
    }

    printKeyValue([
      ["id", response.expense.id],
      ["date", String(response.expense.date).slice(0, 10)],
      ["description", response.expense.description],
      ["category", response.expense.category?.name ?? ""],
      [
        "amount",
        formatMoney(
          toNumber(response.expense.amount),
          response.expense.currency,
        ),
      ],
      ["baseAmount", String(response.expense.baseAmount)],
      ["notes", response.expense.notes ?? ""],
    ]);
    return 0;
  },
};

const editCommand: CommandSpec = {
  name: "edit",
  summary: "Edit one expense or many matching expenses.",
  usage: [
    "centavo expense edit <expense-id> [--amount <amount>] [--description <text>]",
    "centavo expense edit --search <text> --set notes=updated [--preview]",
  ],
  options: [
    {
      name: "ids",
      description: "Comma-separated explicit expense IDs.",
      type: "string",
      placeholder: "id1,id2",
    },
    {
      name: "search",
      description: "Select expenses by description search.",
      type: "string",
      placeholder: "text",
    },
    {
      name: "category",
      description:
        "In batch mode, select by category ID or exact name. With a positional ID, update the category.",
      type: "string",
      placeholder: "category",
    },
    {
      name: "from",
      description: "Select expenses from this date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "to",
      description: "Select expenses through this date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "before",
      description: "Select expenses before this date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "after",
      description: "Select expenses after this date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "amount",
      description: "Set the amount for a single target.",
      type: "number",
      placeholder: "amount",
    },
    {
      name: "currency",
      description: "Set the currency for a single target.",
      type: "string",
      placeholder: "code",
    },
    {
      name: "description",
      description: "Set the description for a single target.",
      type: "string",
      placeholder: "text",
    },
    {
      name: "date",
      description: "Set the date for a single target.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "notes",
      description: "Set notes for a single target.",
      type: "string",
      placeholder: "text",
    },
    {
      name: "clear-notes",
      description: "Clear notes on matched expenses.",
      type: "boolean",
    },
    {
      name: "set",
      description:
        "Set a field for batch mode, for example notes=work or category=Food.",
      type: "string",
      placeholder: "field=value",
      multiple: true,
    },
    {
      name: "preview",
      description: "Preview matches without applying changes.",
      type: "boolean",
    },
    {
      name: "yes",
      description: "Skip the confirmation prompt.",
      type: "boolean",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  examples: [
    "centavo expense edit exp_123 --amount 14.50",
    "centavo expense edit --search Uber --set notes='work trip' --preview",
  ],
  notes: [
    "In batch mode, --category selects matching expenses. Use --set category=<value> to change the category.",
  ],
  run: async (context, input) => {
    const payload = await buildEditPayload(input, context.baseUrl);
    if (Object.keys(payload.data).length === 0) {
      throw new Error("Provide at least one update field.");
    }

    const preview = getBooleanOption(input.options, "preview");
    const yes = getBooleanOption(input.options, "yes");
    const json = getBooleanOption(input.options, "json");

    if (!preview && !yes && !input.positionals[0]) {
      const confirmed = await previewAndConfirm(
        context.baseUrl,
        "/api/expenses/bulk-update",
        { ...payload, preview: true },
        json,
        false,
      );
      if (!confirmed) return 0;
    }

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<Record<string, unknown>>(
      "/api/expenses/bulk-update",
      {
        method: "POST",
        json: {
          ...payload,
          preview,
        },
      },
    );

    if (json) {
      printJson(response);
      return 0;
    }

    process.stdout.write(
      preview
        ? `Matched ${String(response.matched ?? 0)} expense(s).\n`
        : `Updated ${String(response.changed ?? 0)} expense(s).\n`,
    );
    return 0;
  },
};

const deleteCommand: CommandSpec = {
  name: "delete",
  summary: "Delete one expense or many matching expenses.",
  usage: [
    "centavo expense delete <expense-id>",
    "centavo expense delete --search <text> [--preview] [--yes]",
  ],
  options: [
    {
      name: "ids",
      description: "Comma-separated explicit expense IDs.",
      type: "string",
      placeholder: "id1,id2",
    },
    {
      name: "search",
      description: "Select expenses by description search.",
      type: "string",
      placeholder: "text",
    },
    {
      name: "category",
      description: "Select expenses by category ID or exact name.",
      type: "string",
      placeholder: "category",
    },
    {
      name: "from",
      description: "Select expenses from this date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "to",
      description: "Select expenses through this date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "before",
      description: "Select expenses before this date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "after",
      description: "Select expenses after this date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "preview",
      description: "Preview matches without deleting.",
      type: "boolean",
    },
    {
      name: "yes",
      description: "Skip the confirmation prompt.",
      type: "boolean",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  examples: [
    "centavo expense delete exp_123",
    "centavo expense delete --search test --preview",
  ],
  run: async (context, input) => {
    const ids = input.positionals[0] ? [input.positionals[0]] : undefined;
    const selectors = buildSelectorPayload(input.options, ids ? { ids } : {});
    const categoryValue = getStringOption(input.options, "category");
    if (categoryValue) {
      selectors.categoryId = await resolveCategoryId(
        categoryValue,
        context.baseUrl,
      );
    }

    const preview = getBooleanOption(input.options, "preview");
    const yes = getBooleanOption(input.options, "yes");
    const json = getBooleanOption(input.options, "json");

    if (!preview && !yes) {
      const confirmed = await previewAndConfirm(
        context.baseUrl,
        "/api/expenses/bulk-delete",
        { selectors },
        json,
        yes,
      );
      if (!confirmed) return 0;
    }

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<Record<string, unknown>>(
      "/api/expenses/bulk-delete",
      {
        method: "POST",
        json: {
          selectors,
          preview,
        },
      },
    );

    if (json) {
      printJson(response);
      return 0;
    }

    process.stdout.write(
      preview
        ? `Matched ${String(response.matched ?? 0)} expense(s).\n`
        : `Deleted ${String(response.changed ?? 0)} expense(s).\n`,
    );
    return 0;
  },
};

const exportCommand: CommandSpec = {
  name: "export",
  summary: "Export expenses in CSV, JSON, or JSONL format.",
  usage: ["centavo expense export [--format csv|json|jsonl] [--output <path>]"],
  options: [
    {
      name: "search",
      description: "Filter by description search.",
      type: "string",
      placeholder: "text",
    },
    {
      name: "category",
      description: "Filter by category ID or exact name.",
      type: "string",
      placeholder: "category",
    },
    {
      name: "from",
      description: "Filter from date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "to",
      description: "Filter to date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "before",
      description: "Filter before date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "after",
      description: "Filter after date.",
      type: "string",
      placeholder: "date",
    },
    {
      name: "format",
      description: "Output format.",
      type: "string",
      placeholder: "csv|json|jsonl",
    },
    {
      name: "output",
      description: "Write to a file instead of stdout.",
      type: "string",
      placeholder: "path",
    },
  ],
  run: async (context, input) => {
    const format = getStringOption(input.options, "format") ?? "json";
    const selectors = buildSelectorPayload(input.options);
    const categoryValue = getStringOption(input.options, "category");
    if (categoryValue) {
      selectors.categoryId = await resolveCategoryId(
        categoryValue,
        context.baseUrl,
      );
    }

    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(selectors)) {
      if (Array.isArray(value)) {
        for (const item of value) search.append("id", String(item));
      } else {
        search.set(key, String(value));
      }
    }

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{ expenses: ExpenseRecord[] }>(
      `/api/expenses/export?${search.toString()}`,
      { method: "GET" },
    );

    const rows = response.expenses.map((expense) => ({
      id: expense.id,
      amount: expense.amount,
      currency: expense.currency,
      baseAmount: expense.baseAmount,
      description: expense.description,
      category: expense.category?.name ?? "",
      categoryId: expense.category?.id ?? "",
      date: String(expense.date).slice(0, 10),
      notes: expense.notes ?? "",
    }));

    let output = "";
    if (format === "csv") {
      output = stringifyCsv(rows);
    } else if (format === "jsonl") {
      output = rows.map((row) => JSON.stringify(row)).join("\n");
    } else {
      output = JSON.stringify(rows, null, 2);
    }

    const outputPath = getStringOption(input.options, "output");
    if (outputPath) {
      await fs.writeFile(outputPath, output + (format === "json" ? "\n" : ""));
      process.stdout.write(
        `Exported ${rows.length} expense(s) to ${outputPath}.\n`,
      );
      return 0;
    }

    process.stdout.write(output + "\n");
    return 0;
  },
};

const importCommand: CommandSpec = {
  name: "import",
  summary: "Import expenses from CSV or JSONL.",
  usage: [
    "centavo expense import --file <path> --format csv",
    "cat expenses.jsonl | centavo expense import --stdin --format jsonl",
  ],
  options: [
    {
      name: "file",
      description: "Path to the input file.",
      type: "string",
      placeholder: "path",
    },
    {
      name: "stdin",
      description: "Read import data from standard input.",
      type: "boolean",
    },
    {
      name: "format",
      description: "Input format.",
      type: "string",
      placeholder: "csv|jsonl",
    },
    {
      name: "dry-run",
      description: "Validate import rows without creating expenses.",
      type: "boolean",
    },
    {
      name: "continue-on-error",
      description: "Create valid rows even if some rows fail.",
      type: "boolean",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  examples: [
    "centavo expense import --file expenses.csv --format csv",
    "centavo expense import --stdin --format jsonl --dry-run",
  ],
  run: async (context, input) => {
    const format = getStringOption(input.options, "format") ?? "csv";
    const filePath = getStringOption(input.options, "file");
    const fromStdin = getBooleanOption(input.options, "stdin");
    const rows = await parseImportItems(format, filePath, fromStdin);
    const categories = await createApiClient({ baseUrl: context.baseUrl }).then(
      (api) =>
        api.request<{ categories: Array<{ id: string; name: string }> }>(
          "/api/categories",
        ),
    );
    const categoryNameMap = new Map(
      categories.categories.map((category) => [
        category.name.trim().toLowerCase(),
        category.id,
      ]),
    );
    const categoryIdSet = new Set(
      categories.categories.map((category) => category.id),
    );

    const items = rows.map((row) => {
      const categoryValue = row.categoryId || row.category;
      const normalizedCategory =
        typeof categoryValue === "string"
          ? categoryValue.trim().toLowerCase()
          : "";
      const categoryId =
        typeof categoryValue === "string" && categoryIdSet.has(categoryValue)
          ? categoryValue
          : categoryNameMap.get(normalizedCategory);

      if (!categoryId) {
        throw new Error(
          `Unknown category for import row: ${String(categoryValue ?? "")}`,
        );
      }

      return {
        amount: Number(row.amount),
        currency: String(row.currency),
        description: String(row.description),
        categoryId,
        date: String(row.date),
        notes:
          row.notes === undefined || row.notes === ""
            ? undefined
            : String(row.notes),
      };
    });

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<Record<string, unknown>>(
      "/api/expenses/import",
      {
        method: "POST",
        json: {
          items,
          dryRun: getBooleanOption(input.options, "dry-run"),
          continueOnError: getBooleanOption(input.options, "continue-on-error"),
        },
      },
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response);
      return 0;
    }

    process.stdout.write(
      getBooleanOption(input.options, "dry-run")
        ? `Validated ${items.length} row(s).\n`
        : `Imported ${String(response.created ?? 0)} expense(s).\n`,
    );
    const errors =
      (response.errors as
        | Array<{ index: number; message: string }>
        | undefined) ?? [];
    if (errors.length > 0) {
      process.stdout.write(`Errors: ${errors.length}\n`);
      for (const error of errors) {
        process.stdout.write(`  row ${error.index + 1}: ${error.message}\n`);
      }
    }
    return 0;
  },
};

export const expenseCommand: CommandSpec = {
  name: "expense",
  summary: "Manage expenses.",
  usage: [
    "centavo expense add --amount <amount> --description <text> --category <category>",
    "centavo expense list",
    "centavo expense show <expense-id>",
    "centavo expense edit <expense-id>",
    "centavo expense delete <expense-id>",
    "centavo expense import --file <path> --format csv",
    "centavo expense export --format csv",
  ],
  subcommands: [
    addCommand,
    listCommand,
    showCommand,
    editCommand,
    deleteCommand,
    importCommand,
    exportCommand,
  ],
};
