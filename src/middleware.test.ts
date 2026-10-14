import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("next-auth", () => ({
  default: () => ({ auth: (callback: unknown) => callback }),
}));
import middleware from "./middleware";
function request(
  path: string,
  authenticated = false,
  headers?: Record<string, string>,
) {
  const req = new NextRequest(`http://localhost${path}`, { headers });
  Object.assign(req, { auth: authenticated ? { user: { id: "qa" } } : null });
  return req;
}
const run = (req: NextRequest) =>
  (middleware as unknown as (req: NextRequest) => Response)(req);
describe("page authentication boundaries", () => {
  it("redirects a private page to login with a local return path", () => {
    const response = run(request("/expenses"));
    const destination = new URL(response.headers.get("location")!);
    expect(destination.pathname).toBe("/auth/signin");
    expect(destination.searchParams.get("callbackUrl")).toBe("/expenses");
  });
  it("allows public login and authenticated private pages", () => {
    expect(run(request("/auth/signin")).status).toBe(200);
    expect(run(request("/dashboard", true)).status).toBe(200);
  });
  it("leaves API authentication to the route guards", () => {
    expect(run(request("/api/expenses")).status).toBe(200);
  });
  it("detects Spanish for a new visitor", () => {
    expect(
      run(
        request("/auth/signin", false, { "accept-language": "es-AR,es;q=0.9" }),
      ).headers.get("set-cookie"),
    ).toContain("NEXT_LOCALE=es");
  });
});
