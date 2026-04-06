import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaCategory } from "@/test-utils/factories";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";

function createRequest(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

beforeEach(() => {
  resetPrismaMock();
});

describe("GET /api/categories", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await GET(createRequest("/api/categories"));
    expect(res.status).toBe(401);
  });

  it("returns categories", async () => {
    mockAuth();
    const categories = [
      createPrismaCategory(),
      createPrismaCategory({ name: "Transport" }),
    ];
    prismaMock.category.findMany.mockResolvedValue(categories as never);

    const res = await GET(createRequest("/api/categories"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.categories).toHaveLength(2);
  });
});

describe("POST /api/categories", () => {
  const validBody = {
    name: "Food",
    color: "#E8855B",
    icon: "UtensilsCrossed",
  };

  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await POST(
      createRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a category", async () => {
    mockAuth();
    prismaMock.category.findUnique.mockResolvedValue(null as never);
    prismaMock.category.create.mockResolvedValue(
      createPrismaCategory() as never,
    );

    const res = await POST(
      createRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.category).toBeDefined();
  });

  it("returns 400 for duplicate name", async () => {
    mockAuth();
    prismaMock.category.findUnique.mockResolvedValue(
      createPrismaCategory() as never,
    );

    const res = await POST(
      createRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("already exists");
  });

  it("returns 400 for invalid input", async () => {
    mockAuth();
    const res = await POST(
      createRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
