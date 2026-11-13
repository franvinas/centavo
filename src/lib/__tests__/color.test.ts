import { describe, expect, it } from "vitest";

import { hexToHsv, hsvToHex, normalizeHex } from "@/lib/color";

describe("normalizeHex", () => {
  it("uppercases and adds the hash", () => {
    expect(normalizeHex("abc123")).toBe("#ABC123");
    expect(normalizeHex(" #3d8a5a ")).toBe("#3D8A5A");
  });

  it("rejects invalid values", () => {
    expect(normalizeHex("#abc")).toBeNull();
    expect(normalizeHex("red")).toBeNull();
    expect(normalizeHex("#GGGGGG")).toBeNull();
  });
});

describe("hex <-> hsv", () => {
  it("converts primaries", () => {
    expect(hexToHsv("#FF0000")).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv("#00FF00")).toEqual({ h: 120, s: 1, v: 1 });
    expect(hexToHsv("#0000FF")).toEqual({ h: 240, s: 1, v: 1 });
    expect(hexToHsv("#000000")).toEqual({ h: 0, s: 0, v: 0 });
    expect(hsvToHex({ h: 0, s: 0, v: 1 })).toBe("#FFFFFF");
    expect(hsvToHex({ h: 300, s: 1, v: 1 })).toBe("#FF00FF");
  });

  it.each(["#E67E22", "#3D8A5A", "#34495E", "#795548", "#123456", "#FEDCBA"])(
    "round-trips %s",
    (hex) => {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    },
  );

  it("clamps out-of-range values", () => {
    expect(hsvToHex({ h: 720, s: 2, v: -1 })).toBe("#000000");
    expect(hsvToHex({ h: -120, s: 1, v: 1 })).toBe("#0000FF");
  });
});
