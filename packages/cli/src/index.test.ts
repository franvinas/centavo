// @vitest-environment node

import { describe, expect, it } from "vitest";
import { renderHelp } from "./lib/command";
import { parseCsv, stringifyCsv } from "./lib/csv";
import type { CommandSpec } from "./lib/types";

const rootCommand: CommandSpec = {
  name: "centavo",
  summary: "Centavo CLI for expenses, categories, analytics, and settings.",
  usage: [
    "centavo auth login",
    "centavo expense edit --search <text> --set notes=updated --preview",
  ],
  subcommands: [
    {
      name: "expense",
      summary: "Manage expenses.",
      usage: [
        "centavo expense edit <expense-id>",
        "centavo expense edit --search <text> --set notes=updated",
      ],
      subcommands: [
        {
          name: "edit",
          summary: "Edit one expense or many matching expenses.",
          usage: [
            "centavo expense edit <expense-id>",
            "centavo expense edit --search <text> --set notes=updated --preview",
          ],
          options: [
            {
              name: "search",
              description: "Select expenses by description search.",
              type: "string",
              placeholder: "text",
            },
            {
              name: "set",
              description: "Set a field for batch mode.",
              type: "string",
              placeholder: "field=value",
              multiple: true,
            },
          ],
          examples: ["centavo expense edit exp_123 --amount 14.50"],
        },
      ],
    },
  ],
};

describe("CLI help", () => {
  it("renders root help with subcommands", () => {
    const help = renderHelp(rootCommand);

    expect(help).toContain("centavo");
    expect(help).toContain("Commands:");
    expect(help).toContain("expense");
  });

  it("renders batch-friendly help for expense edit", () => {
    const editHelp = renderHelp(
      rootCommand.subcommands?.[0].subcommands?.[0] as CommandSpec,
      ["centavo", "expense"],
    );

    expect(editHelp).toContain("Edit one expense or many matching expenses.");
    expect(editHelp).toContain("--search <text>");
    expect(editHelp).toContain("--set <field=value>");
  });
});

describe("CSV helpers", () => {
  it("round-trips simple CSV rows", () => {
    const csv = stringifyCsv([
      {
        amount: 25,
        currency: "USD",
        description: "Lunch",
      },
    ]);

    const parsed = parseCsv(csv);

    expect(parsed).toEqual([
      {
        amount: "25",
        currency: "USD",
        description: "Lunch",
      },
    ]);
  });
});
