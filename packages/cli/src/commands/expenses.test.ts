// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { expenseCommand } from "./expenses";
import { createApiClient } from "../lib/api";

vi.mock("../lib/api", () => ({
  createApiClient: vi.fn(),
}));

describe("expense delete", () => {
  const request = vi.fn();
  const stdoutWrite = vi
    .spyOn(process.stdout, "write")
    .mockImplementation(() => true);
  const stderrWrite = vi
    .spyOn(process.stderr, "write")
    .mockImplementation(() => true);

  beforeEach(() => {
    request.mockReset();
    stdoutWrite.mockClear();
    stderrWrite.mockClear();
    vi.mocked(createApiClient).mockResolvedValue({
      baseUrl: "http://localhost:3000",
      token: "token",
      persistBaseUrl: vi.fn(),
      request,
    });
  });

  it("returns a single JSON payload for --yes --json deletes", async () => {
    request.mockResolvedValue({
      preview: false,
      matched: 1,
      changed: 1,
      ids: ["exp-1"],
    });

    const command = expenseCommand.subcommands?.find(
      (entry) => entry.name === "delete",
    );
    const exitCode = await command?.run?.(
      {
        baseUrl: "http://localhost:3000",
        stdout: process.stdout,
        stderr: process.stderr,
      },
      {
        options: { yes: true, json: true },
        positionals: ["exp-1"],
      },
    );

    expect(exitCode).toBe(0);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("/api/expenses/bulk-delete", {
      method: "POST",
      json: {
        selectors: { ids: ["exp-1"] },
        preview: false,
      },
    });
    expect(stdoutWrite).toHaveBeenCalledTimes(1);
    expect(String(stdoutWrite.mock.calls[0]?.[0])).toContain('"changed": 1');
  });
});
