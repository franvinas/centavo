// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { expenseCommand } from "./expenses";
import { createApiClient } from "../lib/api";
import { maybeConfirm, readInputFile } from "../lib/helpers";

vi.mock("../lib/api", () => ({
  createApiClient: vi.fn(),
}));

vi.mock("../lib/helpers", async (original) => ({
  ...(await original<typeof import("../lib/helpers")>()),
  maybeConfirm: vi.fn(),
  readInputFile: vi.fn(),
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
    vi.mocked(maybeConfirm).mockReset().mockResolvedValue(true);
    vi.mocked(readInputFile).mockReset();
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
  it("previews, confirms and then applies batch edits", async () => {
    request
      .mockResolvedValueOnce({ preview: true, matched: 1 })
      .mockResolvedValueOnce({ preview: false, changed: 1 });
    const command = expenseCommand.subcommands!.find(
      (entry) => entry.name === "edit",
    )!;
    await command.run!(
      { stdout: process.stdout, stderr: process.stderr },
      { options: { search: "Uber", set: ["notes=work"] }, positionals: [] },
    );
    expect(maybeConfirm).toHaveBeenCalledWith(
      "Proceed with this change?",
      false,
    );
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][1].json.preview).toBe(true);
    expect(request.mock.calls[1][1].json).toEqual({
      selectors: { search: "Uber" },
      data: { notes: "work" },
      preview: false,
    });
  });
  it("does not apply batch edits after declining confirmation", async () => {
    vi.mocked(maybeConfirm).mockResolvedValue(false);
    request.mockResolvedValue({ preview: true, matched: 1 });
    const command = expenseCommand.subcommands!.find(
      (entry) => entry.name === "edit",
    )!;
    await command.run!(
      { stdout: process.stdout, stderr: process.stderr },
      { options: { search: "Uber", set: ["notes=work"] }, positionals: [] },
    );
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1].json.preview).toBe(true);
  });
  it("does not confirm or apply in explicit preview mode", async () => {
    request.mockResolvedValue({ preview: true, matched: 1 });
    const command = expenseCommand.subcommands!.find(
      (entry) => entry.name === "edit",
    )!;
    await command.run!(
      { stdout: process.stdout, stderr: process.stderr },
      {
        options: { search: "Uber", set: ["notes=work"], preview: true },
        positionals: [],
      },
    );
    expect(maybeConfirm).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1].json.preview).toBe(true);
  });
  it("allows the server to report unknown categories per CSV row", async () => {
    vi.mocked(readInputFile).mockResolvedValue(
      "amount,currency,description,category,date\n25,USD,Lunch,Food,2025-01-15\n10,USD,Dinner,Unknown,2025-01-15",
    );
    request
      .mockResolvedValueOnce({ categories: [{ id: "cat-1", name: "Food" }] })
      .mockResolvedValueOnce({
        created: 1,
        errors: [{ index: 1, message: "Category is required" }],
      });
    const command = expenseCommand.subcommands!.find(
      (entry) => entry.name === "import",
    )!;
    await command.run!(
      { stdout: process.stdout, stderr: process.stderr },
      {
        options: { file: "expenses.csv", "continue-on-error": true },
        positionals: [],
      },
    );
    expect(
      request.mock.calls[1][1].json.items.map(
        (row: { categoryId: string }) => row.categoryId,
      ),
    ).toEqual(["cat-1", ""]);
    expect(request.mock.calls[1][1].json.continueOnError).toBe(true);
  });
  it("preserves invalid JSONL row indices while continuing", async () => {
    vi.mocked(readInputFile).mockResolvedValue(
      JSON.stringify({
        amount: 25,
        currency: "USD",
        description: "Lunch",
        category: "Food",
        date: "2025-01-15",
      }) + "\ninvalid json",
    );
    request
      .mockResolvedValueOnce({ categories: [{ id: "cat-1", name: "Food" }] })
      .mockResolvedValueOnce({
        created: 1,
        errors: [{ index: 1, message: "Invalid expense" }],
      });
    const command = expenseCommand.subcommands!.find(
      (entry) => entry.name === "import",
    )!;
    await command.run!(
      { stdout: process.stdout, stderr: process.stderr },
      {
        options: {
          file: "expenses.jsonl",
          format: "jsonl",
          "continue-on-error": true,
        },
        positionals: [],
      },
    );
    expect(request.mock.calls[1][1].json.items[1]).toBeNull();
  });
  it("rejects malformed JSONL in strict mode before making any requests", async () => {
    vi.mocked(readInputFile).mockResolvedValue("invalid json");
    const command = expenseCommand.subcommands!.find(
      (entry) => entry.name === "import",
    )!;
    await expect(
      command.run!(
        { stdout: process.stdout, stderr: process.stderr },
        {
          options: { file: "expenses.jsonl", format: "jsonl" },
          positionals: [],
        },
      ),
    ).rejects.toThrow("Invalid JSONL on row 1");
    expect(request).not.toHaveBeenCalled();
  });
});
