#!/usr/bin/env node

import { runCommand } from "./lib/command";
import type { CommandSpec } from "./lib/types";
import { authCommand } from "./commands/auth";
import { setupCommand } from "./commands/setup";
import { expenseCommand } from "./commands/expenses";
import { categoryCommand } from "./commands/categories";
import { dashboardCommand } from "./commands/dashboard";
import { analyticsCommand } from "./commands/analytics";
import { settingsCommand } from "./commands/settings";
import { telegramCommand } from "./commands/telegram";

function extractGlobalOptions(argv: string[]) {
  const args = [...argv];
  let baseUrl: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--base-url") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --base-url");
      }
      baseUrl = value;
      args.splice(index, 2);
      index -= 1;
    }
  }

  return { baseUrl, args };
}

const rootCommand: CommandSpec = {
  name: "centavo",
  summary: "Centavo CLI for expenses, categories, analytics, and settings.",
  usage: [
    "centavo auth login",
    "centavo expense add --amount <amount> --description <text> --category <category>",
    "centavo expense edit --search <text> --set notes=updated --preview",
    "centavo category list",
    "centavo dashboard",
    "centavo analytics summary",
    "centavo settings show",
  ],
  options: [
    {
      name: "base-url",
      description: "Override the Centavo API base URL.",
      type: "string",
      placeholder: "url",
    },
  ],
  examples: [
    "centavo auth login",
    "centavo expense add --amount 12.50 --description Coffee --category Food",
    "centavo expense delete --search test --preview",
    "centavo settings set --base-currency ARS --locale es",
  ],
  subcommands: [
    authCommand,
    setupCommand,
    expenseCommand,
    categoryCommand,
    dashboardCommand,
    analyticsCommand,
    settingsCommand,
    telegramCommand,
  ],
};

async function main() {
  const { baseUrl, args } = extractGlobalOptions(process.argv.slice(2));
  const exitCode = await runCommand(rootCommand, args, {
    baseUrl,
    stdout: process.stdout,
    stderr: process.stderr,
  });
  process.exitCode = exitCode;
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Unknown error"}\n`,
  );
  process.exitCode = 1;
});
