import os from "node:os";
import { createApiClient, ApiError } from "../lib/api";
import { loadConfig, saveConfig, clearConfigToken } from "../lib/config";
import { openBrowser } from "../lib/io";
import { printJson, printKeyValue } from "../lib/output";
import type { CommandSpec } from "../lib/types";
import { getBooleanOption, getStringOption } from "../lib/helpers";

interface AuthRequestResponse {
  requestId: string;
  code: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresAt: string;
  interval: number;
}

interface AuthConsumeResponse {
  token: string;
  tokenType: string;
  name: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    baseCurrency: string;
    locale: string;
  } | null;
}

const loginCommand: CommandSpec = {
  name: "login",
  summary: "Authenticate this machine with Centavo.",
  usage: ["centavo auth login [--no-browser] [--name <label>]"],
  options: [
    {
      name: "no-browser",
      description: "Do not open the browser automatically.",
      type: "boolean",
    },
    {
      name: "name",
      description: "Optional label for this CLI session.",
      type: "string",
      placeholder: "label",
    },
  ],
  examples: [
    "centavo auth login",
    "centavo auth login --no-browser",
    "centavo auth login --name laptop",
  ],
  run: async (context, input) => {
    const api = await createApiClient({
      baseUrl: context.baseUrl,
      auth: false,
    });
    const label = getStringOption(input.options, "name") ?? os.hostname();
    const noBrowser = getBooleanOption(input.options, "no-browser");

    const authRequest = await api.request<AuthRequestResponse>(
      "/api/cli/auth/requests",
      {
        method: "POST",
        json: {},
      },
    );

    context.stdout.write(
      `Open this URL to approve the CLI login:\n${authRequest.verificationUriComplete}\n\n`,
    );
    context.stdout.write(`Verification code: ${authRequest.userCode}\n`);

    if (!noBrowser) {
      try {
        await openBrowser(authRequest.verificationUriComplete);
      } catch {
        context.stderr.write("Could not open the browser automatically.\n");
      }
    }

    const expiresAt = new Date(authRequest.expiresAt).getTime();
    while (Date.now() < expiresAt) {
      await new Promise((resolve) =>
        setTimeout(resolve, authRequest.interval * 1000),
      );

      const status = await api.request<{
        status: string;
      }>(
        `/api/cli/auth/requests/${authRequest.requestId}?code=${encodeURIComponent(authRequest.code)}`,
        {
          method: "GET",
        },
      );

      if (status.status === "approved") {
        const consumed = await api.request<AuthConsumeResponse>(
          `/api/cli/auth/requests/${authRequest.requestId}/consume`,
          {
            method: "POST",
            json: {
              code: authRequest.code,
              name: label,
            },
          },
        );

        const existingConfig = await loadConfig();
        await saveConfig({
          ...existingConfig,
          baseUrl: api.baseUrl,
          token: consumed.token,
        });

        context.stdout.write(
          `Signed in as ${consumed.user?.email ?? "unknown user"}.\n`,
        );
        return 0;
      }

      if (status.status === "expired" || status.status === "consumed") {
        throw new ApiError(
          "CLI login request expired. Run the command again.",
          400,
        );
      }
    }

    throw new ApiError(
      "CLI login request expired. Run the command again.",
      400,
    );
  },
};

const logoutCommand: CommandSpec = {
  name: "logout",
  summary: "Remove the current CLI session.",
  usage: ["centavo auth logout"],
  run: async (context) => {
    try {
      const api = await createApiClient({ baseUrl: context.baseUrl });
      await api.request("/api/cli/auth/revoke", {
        method: "POST",
      });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }
    }

    await clearConfigToken();
    context.stdout.write("Signed out.\n");
    return 0;
  },
};

const whoamiCommand: CommandSpec = {
  name: "whoami",
  summary: "Show the currently authenticated Centavo user.",
  usage: ["centavo auth whoami [--json]"],
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

    printKeyValue([
      ["id", String(response.user.id)],
      ["email", String(response.user.email)],
      ["name", String(response.user.name ?? "")],
      ["baseCurrency", String(response.user.baseCurrency ?? "")],
      ["locale", String(response.user.locale ?? "")],
      ["timezone", String(response.user.timezone ?? "")],
    ]);

    return 0;
  },
};

export const authCommand: CommandSpec = {
  name: "auth",
  summary: "Manage CLI authentication.",
  usage: ["centavo auth login", "centavo auth logout", "centavo auth whoami"],
  subcommands: [loginCommand, logoutCommand, whoamiCommand],
};
