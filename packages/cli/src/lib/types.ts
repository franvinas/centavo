export type OptionType = "string" | "number" | "boolean";

export interface OptionSpec {
  name: string;
  description: string;
  type: OptionType;
  placeholder?: string;
  multiple?: boolean;
}

export interface ParsedCommandInput {
  options: Record<string, string | string[] | number | boolean | undefined>;
  positionals: string[];
}

export interface CommandSpec {
  name: string;
  summary: string;
  usage: string[];
  options?: OptionSpec[];
  examples?: string[];
  notes?: string[];
  subcommands?: CommandSpec[];
  run?: (
    context: CommandContext,
    input: ParsedCommandInput,
  ) => Promise<number | void>;
}

export interface CommandContext {
  baseUrl?: string;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
}
