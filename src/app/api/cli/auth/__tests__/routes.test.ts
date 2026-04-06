import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { createPrismaUser } from "@/test-utils/factories";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { POST as createAuthRequest } from "../requests/route";
import { GET as getAuthRequest } from "../requests/[id]/route";
import { POST as approveAuthRequest } from "../requests/[id]/approve/route";
import { POST as consumeAuthRequest } from "../requests/[id]/consume/route";
import { POST as revokeCliToken } from "../revoke/route";

function createRequest(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

const routeParams = { params: Promise.resolve({ id: "req-1" }) };

beforeEach(() => {
  resetPrismaMock();
  mockUnauthenticated();
});

describe("POST /api/cli/auth/requests", () => {
  it("creates an auth request", async () => {
    prismaMock.cliAuthRequest.create.mockResolvedValue({
      id: "req-1",
      code: "request-secret",
      userCode: "ABCD-EFGH",
      status: "pending",
      userId: null,
      expiresAt: new Date("2026-04-06T12:10:00.000Z"),
      approvedAt: null,
      consumedAt: null,
      createdAt: new Date("2026-04-06T12:00:00.000Z"),
    } as never);

    const res = await createAuthRequest(
      createRequest("/api/cli/auth/requests", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.requestId).toBe("req-1");
    expect(body.verificationUriComplete).toContain("/cli/auth?");
  });
});

describe("GET /api/cli/auth/requests/:id", () => {
  it("returns auth request status", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prismaMock.cliAuthRequest.findFirst.mockResolvedValue({
      id: "req-1",
      code: "request-secret",
      userCode: "ABCD-EFGH",
      status: "pending",
      userId: null,
      expiresAt,
      approvedAt: null,
      consumedAt: null,
      createdAt: new Date("2026-04-06T12:00:00.000Z"),
    } as never);

    const res = await getAuthRequest(
      createRequest("/api/cli/auth/requests/req-1?code=request-secret"),
      routeParams,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("pending");
    expect(body.userCode).toBe("ABCD-EFGH");
  });
});

describe("POST /api/cli/auth/requests/:id/approve", () => {
  it("returns 401 without a browser session", async () => {
    const res = await approveAuthRequest(
      createRequest("/api/cli/auth/requests/req-1/approve", {
        method: "POST",
        body: JSON.stringify({ code: "request-secret" }),
      }),
      routeParams,
    );

    expect(res.status).toBe(401);
  });

  it("approves an auth request for the signed-in user", async () => {
    mockAuth("user-1");
    const expiresAt = new Date(Date.now() + 60_000);
    prismaMock.cliAuthRequest.findFirst.mockResolvedValue({
      id: "req-1",
      code: "request-secret",
      userCode: "ABCD-EFGH",
      status: "pending",
      userId: null,
      expiresAt,
      approvedAt: null,
      consumedAt: null,
      createdAt: new Date("2026-04-06T12:00:00.000Z"),
    } as never);
    prismaMock.cliAuthRequest.update.mockResolvedValue({
      id: "req-1",
      userCode: "ABCD-EFGH",
      status: "approved",
      userId: "user-1",
      expiresAt,
      approvedAt: new Date("2026-04-06T12:01:00.000Z"),
    } as never);

    const res = await approveAuthRequest(
      createRequest("/api/cli/auth/requests/req-1/approve", {
        method: "POST",
        body: JSON.stringify({ code: "request-secret" }),
      }),
      routeParams,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prismaMock.cliAuthRequest.update).toHaveBeenCalled();
  });
});

describe("POST /api/cli/auth/requests/:id/consume", () => {
  it("exchanges an approved request for a CLI token", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prismaMock.$transaction.mockImplementation(
      async (callback) => callback(prismaMock as never) as never,
    );
    prismaMock.cliAuthRequest.findFirst.mockResolvedValue({
      id: "req-1",
      status: "approved",
      userId: "user-1",
      expiresAt,
    } as never);
    prismaMock.cliAuthRequest.updateMany.mockResolvedValue({
      count: 1,
    } as never);
    prismaMock.cliToken.create.mockResolvedValue({
      id: "cli-token-1",
      userId: "user-1",
      name: "Laptop",
      tokenHash: "hashed",
      lastUsedAt: null,
      expiresAt: null,
      revokedAt: null,
      createdAt: new Date("2026-04-06T12:01:00.000Z"),
    } as never);
    prismaMock.user.findUnique.mockResolvedValue(
      createPrismaUser({ locale: "en" }) as never,
    );

    const res = await consumeAuthRequest(
      createRequest("/api/cli/auth/requests/req-1/consume", {
        method: "POST",
        body: JSON.stringify({ code: "request-secret", name: "Laptop" }),
      }),
      routeParams,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tokenType).toBe("Bearer");
    expect(body.user.email).toBe("test@example.com");
    expect(prismaMock.cliToken.create).toHaveBeenCalled();
  });
});

describe("POST /api/cli/auth/revoke", () => {
  it("revokes the current CLI token", async () => {
    prismaMock.cliToken.findUnique.mockResolvedValue({
      id: "cli-token-1",
      revokedAt: null,
      expiresAt: null,
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        image: null,
      },
    } as never);
    prismaMock.cliToken.update
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce({} as never);

    const res = await revokeCliToken(
      createRequest("/api/cli/auth/revoke", {
        method: "POST",
        headers: { authorization: "Bearer ctv_valid_token" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prismaMock.cliToken.update).toHaveBeenCalledTimes(2);
  });
});
