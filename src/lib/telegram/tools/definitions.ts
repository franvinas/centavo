import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "add_expense",
      description:
        "Add a new expense. Always use this immediately when the user mentions spending money.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "The expense amount" },
          currency: {
            type: "string",
            description:
              "3-letter ISO currency code (e.g. USD, EUR, ARS). Defaults to user's base currency if not specified.",
          },
          description: {
            type: "string",
            description: "Short description of the expense",
          },
          categoryId: {
            type: "string",
            description:
              "Category ID from the available categories. Pick the best match.",
          },
          date: {
            type: "string",
            description:
              "Date in YYYY-MM-DD format. Defaults to today if not specified.",
          },
          notes: {
            type: "string",
            description: "Optional notes",
          },
        },
        required: ["amount", "description", "categoryId", "date", "currency"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_expense",
      description:
        "Edit an existing expense. Only update the fields mentioned.",
      parameters: {
        type: "object",
        properties: {
          expenseId: { type: "string", description: "The expense ID to edit" },
          amount: { type: "number" },
          currency: { type: "string" },
          description: { type: "string" },
          categoryId: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD format" },
          notes: { type: "string" },
        },
        required: ["expenseId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_expense",
      description: "Delete an expense by ID.",
      parameters: {
        type: "object",
        properties: {
          expenseId: {
            type: "string",
            description: "The expense ID to delete",
          },
        },
        required: ["expenseId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_expenses",
      description:
        "List recent expenses. Use to find expense IDs for editing/deleting, or to show the user their expenses.",
      parameters: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Start date filter (YYYY-MM-DD)",
          },
          to: {
            type: "string",
            description: "End date filter (YYYY-MM-DD)",
          },
          categoryId: {
            type: "string",
            description: "Filter by category ID",
          },
          search: {
            type: "string",
            description: "Search in descriptions",
          },
          limit: {
            type: "number",
            description: "Max results (default 10)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_summary",
      description:
        "Get a spending summary for the current month including total spent, expense count, and comparison to last month.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_analytics_by_category",
      description: "Get spending breakdown by category for a date range.",
      parameters: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Start date (YYYY-MM-DD)",
          },
          to: {
            type: "string",
            description: "End date (YYYY-MM-DD)",
          },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_categories",
      description: "List all available expense categories.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];
