import { createApiClient } from "../lib/api";
import {
  getBooleanOption,
  getStringOption,
  maybeConfirm,
  printCategoryTable,
  resolveCategoryId,
} from "./category-shared";
import { printJson } from "../lib/output";
import type { CommandSpec } from "../lib/types";

const listCommand: CommandSpec = {
  name: "list",
  summary: "List categories.",
  usage: ["centavo category list [--json]"],
  options: [
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  run: async (context, input) => {
    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{
      categories: Array<Record<string, unknown>>;
    }>("/api/categories");

    if (getBooleanOption(input.options, "json")) {
      printJson(response.categories);
      return 0;
    }

    printCategoryTable(response.categories);
    return 0;
  },
};

const addCommand: CommandSpec = {
  name: "add",
  summary: "Create a category.",
  usage: [
    "centavo category add --name <name> --color <#RRGGBB> [--icon <icon>]",
  ],
  options: [
    {
      name: "name",
      description: "Category name.",
      type: "string",
      placeholder: "name",
    },
    {
      name: "color",
      description: "Category hex color.",
      type: "string",
      placeholder: "#RRGGBB",
    },
    {
      name: "icon",
      description: "Optional icon name.",
      type: "string",
      placeholder: "icon",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  examples: [
    "centavo category add --name Food --color '#E67E22' --icon UtensilsCrossed",
  ],
  run: async (context, input) => {
    const name = getStringOption(input.options, "name");
    const color = getStringOption(input.options, "color");
    const icon = getStringOption(input.options, "icon");

    if (!name || !color) {
      throw new Error("Both --name and --color are required.");
    }

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{ category: Record<string, unknown> }>(
      "/api/categories",
      {
        method: "POST",
        json: { name, color, icon },
      },
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response.category);
      return 0;
    }

    process.stdout.write(
      `Created category ${String(response.category.name)}.\n`,
    );
    return 0;
  },
};

const editCommand: CommandSpec = {
  name: "edit",
  summary: "Update a category.",
  usage: [
    "centavo category edit <category-id> [--name <name>] [--color <#RRGGBB>] [--icon <icon>]",
  ],
  options: [
    {
      name: "name",
      description: "New category name.",
      type: "string",
      placeholder: "name",
    },
    {
      name: "color",
      description: "New category color.",
      type: "string",
      placeholder: "#RRGGBB",
    },
    {
      name: "icon",
      description: "New icon name.",
      type: "string",
      placeholder: "icon",
    },
    {
      name: "json",
      description: "Print machine-readable JSON output.",
      type: "boolean",
    },
  ],
  run: async (context, input) => {
    const id = input.positionals[0];
    if (!id) throw new Error("Category ID is required.");

    const payload: Record<string, string> = {};
    for (const key of ["name", "color", "icon"] as const) {
      const value = getStringOption(input.options, key);
      if (value) payload[key] = value;
    }

    if (Object.keys(payload).length === 0) {
      throw new Error("Provide at least one field to update.");
    }

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{ category: Record<string, unknown> }>(
      `/api/categories/${id}`,
      {
        method: "PUT",
        json: payload,
      },
    );

    if (getBooleanOption(input.options, "json")) {
      printJson(response.category);
      return 0;
    }

    process.stdout.write(
      `Updated category ${String(response.category.name)}.\n`,
    );
    return 0;
  },
};

const deleteCommand: CommandSpec = {
  name: "delete",
  summary: "Delete a category.",
  usage: ["centavo category delete <category-id> [--yes]"],
  options: [
    {
      name: "yes",
      description: "Skip the confirmation prompt.",
      type: "boolean",
    },
  ],
  run: async (context, input) => {
    const id = input.positionals[0];
    if (!id) throw new Error("Category ID is required.");

    const confirmed = await maybeConfirm(
      `Delete category ${id}?`,
      getBooleanOption(input.options, "yes"),
    );
    if (!confirmed) return 0;

    const api = await createApiClient({ baseUrl: context.baseUrl });
    await api.request(`/api/categories/${id}`, { method: "DELETE" });
    process.stdout.write(`Deleted category ${id}.\n`);
    return 0;
  },
};

const reassignCommand: CommandSpec = {
  name: "reassign",
  summary: "Reassign expenses from one category to another.",
  usage: [
    "centavo category reassign --from <category> --to <category> [--yes]",
  ],
  options: [
    {
      name: "from",
      description: "Source category ID or exact name.",
      type: "string",
      placeholder: "category",
    },
    {
      name: "to",
      description: "Destination category ID or exact name.",
      type: "string",
      placeholder: "category",
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
  examples: ["centavo category reassign --from Transport --to Commute --yes"],
  run: async (context, input) => {
    const fromValue = getStringOption(input.options, "from");
    const toValue = getStringOption(input.options, "to");

    if (!fromValue || !toValue) {
      throw new Error("Both --from and --to are required.");
    }

    const fromCategoryId = await resolveCategoryId(fromValue, context.baseUrl);
    const toCategoryId = await resolveCategoryId(toValue, context.baseUrl);

    const confirmed = await maybeConfirm(
      `Reassign expenses from ${fromValue} to ${toValue}?`,
      getBooleanOption(input.options, "yes"),
    );
    if (!confirmed) return 0;

    const api = await createApiClient({ baseUrl: context.baseUrl });
    const response = await api.request<{
      success: boolean;
      reassigned: number;
    }>("/api/categories/reassign", {
      method: "POST",
      json: { fromCategoryId, toCategoryId },
    });

    if (getBooleanOption(input.options, "json")) {
      printJson(response);
      return 0;
    }

    process.stdout.write(`Reassigned ${response.reassigned} expense(s).\n`);
    return 0;
  },
};

export const categoryCommand: CommandSpec = {
  name: "category",
  summary: "Manage categories.",
  usage: [
    "centavo category list",
    "centavo category add --name <name> --color <#RRGGBB>",
    "centavo category edit <category-id>",
    "centavo category delete <category-id>",
    "centavo category reassign --from <category> --to <category>",
  ],
  subcommands: [
    listCommand,
    addCommand,
    editCommand,
    deleteCommand,
    reassignCommand,
  ],
};
