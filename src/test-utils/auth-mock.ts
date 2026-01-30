import { vi } from "vitest";

const authMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

export function mockAuth(userId: string = "user-1") {
  authMock.mockResolvedValue({
    user: { id: userId, name: "Test User", email: "test@example.com" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  });
}

export function mockUnauthenticated() {
  authMock.mockResolvedValue(null);
}

export { authMock };
