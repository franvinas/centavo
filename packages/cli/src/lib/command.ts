import { ApiError } from "./api";
import type {
  CommandContext,
  CommandSpec,
  OptionSpec,
  ParsedCommandInput,
} from "./types";

function parseOptionValue(type: OptionSpec["type"], raw: string) {
  if (type === "number") {
    const value = Number(raw);
    if (Number.isNaN(value)) {
      throw new Error(`Invalid number: ${raw}`);
    }
    return value;
  }

  if (type === "boolean") {
    return true;
  }

  return raw;
}

function renderOptions(options: OptionSpec[] = []) {
  if (options.length === 0) return [];

  const labels = options.map((option) =>
    option.type === "boolean"
      ? `--${option.name}`
      : `--${option.name} <${option.placeholder ?? option.name}>`,
  );
  const width = labels.reduce((max, label) => Math.max(max, label.length), 0);

  return labels.map(
    (label, index) => `  ${label.padEnd(width)}  ${options[index].description}`,
  );
}

export function renderHelp(command: CommandSpec, chain: string[] = []) {
  const title = [...chain, command.name].join(" ").trim() || "centavo";
  const lines = [`${title}`, "", command.summary, "", "Usage:"];

  for (const usage of command.usage) {
    lines.push(`  ${usage}`);
  }

  if (command.subcommands?.length) {
    lines.push("", "Commands:");
    const width = command.subcommands.reduce(
      (max, child) => Math.max(max, child.name.length),
      0,
    );
    for (const child of command.subcommands) {
      lines.push(`  ${child.name.padEnd(width)}  ${child.summary}`);
    }
  }

  const optionLines = renderOptions(command.options);
  if (optionLines.length > 0) {
    lines.push("", "Options:", ...optionLines);
  }

  if (command.examples?.length) {
    lines.push("", "Examples:");
    for (const example of command.examples) {
      lines.push(`  ${example}`);
    }
  }

  if (command.notes?.length) {
    lines.push("", "Notes:");
    for (const note of command.notes) {
      lines.push(`  ${note}`);
    }
  }

  return lines.join("\n");
}

function parseInput(
  args: string[],
  options: OptionSpec[] = [],
): ParsedCommandInput {
  const optionMap = new Map(options.map((option) => [option.name, option]));
  const result: ParsedCommandInput = { options: {}, positionals: [] };

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (!token.startsWith("--")) {
      result.positionals.push(token);
      continue;
    }

    const name = token.slice(2);
    if (name === "help") {
      result.options.help = true;
      continue;
    }

    const option = optionMap.get(name);
    if (!option) {
      throw new Error(`Unknown option: --${name}`);
    }

    if (option.type === "boolean") {
      result.options[name] = true;
      continue;
    }

    const rawValue = args[index + 1];
    if (!rawValue || rawValue.startsWith("--")) {
      throw new Error(`Missing value for --${name}`);
    }

    const value = parseOptionValue(option.type, rawValue);
    if (option.multiple) {
      const values =
        (result.options[name] as Array<string | number> | undefined) ?? [];
      values.push(value as string | number);
      result.options[name] = values as unknown as string[];
    } else {
      result.options[name] = value;
    }
    index += 1;
  }

  return result;
}

function resolveCommand(
  root: CommandSpec,
  args: string[],
  chain: string[] = [],
): { command: CommandSpec; chain: string[]; remaining: string[] } {
  if (!args.length || !root.subcommands?.length) {
    return { command: root, chain, remaining: args };
  }

  const [next, ...rest] = args;
  const child = root.subcommands.find((command) => command.name === next);
  if (!child) {
    return { command: root, chain, remaining: args };
  }

  return resolveCommand(child, rest, [...chain, root.name].filter(Boolean));
}

export async function runCommand(
  root: CommandSpec,
  args: string[],
  context: CommandContext,
) {
  const { command, chain, remaining } = resolveCommand(root, args);

  try {
    const parsed = parseInput(remaining, command.options);

    if (parsed.options.help || (!command.run && command.subcommands?.length)) {
      context.stdout.write(renderHelp(command, chain) + "\n");
      return 0;
    }

    if (!command.run) {
      throw new Error("No command handler defined");
    }

    return (await command.run(context, parsed)) ?? 0;
  } catch (error) {
    if (error instanceof ApiError) {
      context.stderr.write(`${error.message}\n`);
      return error.status === 401 ? 3 : 1;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    context.stderr.write(`${message}\n\n${renderHelp(command, chain)}\n`);
    return 2;
  }
}
