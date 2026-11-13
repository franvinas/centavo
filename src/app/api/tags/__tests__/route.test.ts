import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { GET } from "../route";
import { DELETE, PUT } from "../[id]/route";

const service = vi.hoisted(() => ({
  listTagsWithTotalsForUser: vi.fn(),
  renameTagForUser: vi.fn(),
  deleteTagForUser: vi.fn(),
}));
vi.mock("@/lib/services/tags", () => service);

function request(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}
const params = { params: Promise.resolve({ id: "tag-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth();
});

describe("/api/tags", () => {
  it("requires auth", async () => {
    mockUnauthenticated();
    expect((await GET(request("/api/tags"))).status).toBe(401);
    expect((await PUT(request("/api/tags/tag-1"), params)).status).toBe(401);
    expect((await DELETE(request("/api/tags/tag-1"), params)).status).toBe(401);
  });

  it("lists tags with totals for the current user", async () => {
    service.listTagsWithTotalsForUser.mockResolvedValue([
      { id: "tag-1", name: "trip", expenseCount: 2, total: 130 },
    ]);
    const res = await GET(request("/api/tags"));
    expect(res.status).toBe(200);
    expect((await res.json()).tags[0]).toMatchObject({
      name: "trip",
      total: 130,
    });
    expect(service.listTagsWithTotalsForUser).toHaveBeenCalledWith("user-1");
  });

  it("renames with a normalized name and reports merges", async () => {
    service.renameTagForUser.mockResolvedValue({
      tag: { id: "tag-2", name: "trip" },
      merged: true,
    });
    const res = await PUT(
      request("/api/tags/tag-1", {
        method: "PUT",
        body: JSON.stringify({ name: " #Trip " }),
      }),
      params,
    );
    expect(res.status).toBe(200);
    expect((await res.json()).merged).toBe(true);
    expect(service.renameTagForUser).toHaveBeenCalledWith("user-1", "tag-1", {
      name: "trip",
    });
  });

  it("rejects invalid names and maps missing tags to 404", async () => {
    const bad = await PUT(
      request("/api/tags/tag-1", {
        method: "PUT",
        body: JSON.stringify({ name: "" }),
      }),
      params,
    );
    expect(bad.status).toBe(400);

    service.deleteTagForUser.mockRejectedValue(new Error("Tag not found"));
    expect((await DELETE(request("/api/tags/tag-1"), params)).status).toBe(404);
  });
});
