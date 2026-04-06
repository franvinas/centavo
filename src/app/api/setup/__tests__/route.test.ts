import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { POST } from "../route";

function createRequest(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

beforeEach(() => {
  resetPrismaMock();
});

describe("POST /api/setup", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();

    const res = await POST(
      createRequest("/api/setup", {
        method: "POST",
        body: JSON.stringify({
          name: "Fran",
          baseCurrency: "USD",
          locale: "en",
        }),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("updates the user and seeds default categories", async () => {
    mockAuth("user-1");
    prismaMock.user.update.mockResolvedValue({
      id: "user-1",
      name: "Fran",
      email: "test@example.com",
      baseCurrency: "ARS",
      locale: "es",
    } as never);
    prismaMock.category.count.mockResolvedValue(0 as never);
    prismaMock.category.createMany.mockResolvedValue({ count: 8 } as never);

    const res = await POST(
      createRequest("/api/setup", {
        method: "POST",
        body: JSON.stringify({
          name: "Fran",
          baseCurrency: "ARS",
          locale: "es",
        }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.user.locale).toBe("es");
    expect(prismaMock.category.createMany).toHaveBeenCalled();
  });
});
