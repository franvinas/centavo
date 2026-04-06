import { loadConfig, resolveBaseUrl, saveConfig } from "./config";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  auth?: boolean;
}

type RequestOptions = RequestInit & {
  json?: unknown;
  auth?: boolean;
};

export async function createApiClient(options: ApiClientOptions = {}) {
  const config = await loadConfig();
  const baseUrl = resolveBaseUrl(options.baseUrl, config);
  const token = config.token;

  return {
    baseUrl,
    token,
    async persistBaseUrl() {
      await saveConfig({
        ...config,
        baseUrl,
        token,
      });
    },
    async request<T>(pathname: string, init: RequestOptions = {}): Promise<T> {
      const authRequired = init.auth ?? options.auth ?? true;
      const headers = new Headers(init.headers);

      if (authRequired) {
        if (!token) {
          throw new ApiError(
            "Not authenticated. Run `centavo auth login` first.",
            401,
            "UNAUTHORIZED",
          );
        }
        headers.set("Authorization", `Bearer ${token}`);
      }

      if (init.json !== undefined) {
        headers.set("Content-Type", "application/json");
      }

      const res = await fetch(new URL(pathname, baseUrl), {
        ...init,
        headers,
        body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      });

      const text = await res.text();
      let body: unknown = null;

      if (text) {
        try {
          body = JSON.parse(text) as unknown;
        } catch {
          throw new ApiError(
            `Expected JSON response from ${pathname}, received ${res.status} ${res.statusText}.`,
            res.status || 500,
          );
        }
      }

      if (!res.ok) {
        const errorBody = body as { error?: string; code?: string } | null;
        throw new ApiError(
          errorBody?.error ?? `Request failed with status ${res.status}`,
          res.status,
          errorBody?.code,
        );
      }

      return body as T;
    },
  };
}
