import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

export interface CliConfig {
  baseUrl?: string;
  token?: string;
}

const configDir = process.env.CENTAVO_CONFIG_DIR
  ? path.resolve(process.env.CENTAVO_CONFIG_DIR)
  : path.join(os.homedir(), ".config", "centavo");

const configPath = path.join(configDir, "config.json");

async function ensureConfigDir() {
  await fs.mkdir(configDir, { recursive: true, mode: 0o700 });
}

export async function loadConfig(): Promise<CliConfig> {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return JSON.parse(raw) as CliConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(config: CliConfig) {
  await ensureConfigDir();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
}

export async function clearConfigToken() {
  const config = await loadConfig();
  if (!config.token) return;

  delete config.token;
  await saveConfig(config);
}

export function resolveBaseUrl(input?: string, config?: CliConfig) {
  return (
    input ||
    config?.baseUrl ||
    process.env.CENTAVO_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://centavo.vercel.app/"
  );
}
