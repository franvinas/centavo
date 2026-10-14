// @vitest-environment node
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
const braces = createRequire(import.meta.url)("braces");
describe("patched glob dependency", () => {
  it.each(["compile", "expand", "stringify", "parse"])(
    "rejects malicious nesting in %s before exhausting the stack",
    (method) => {
      const pattern = "{".repeat(3000) + "a,b" + "}".repeat(3000);
      expect(() => braces[method](pattern)).toThrow(SyntaxError);
      expect(() => braces[method](pattern)).toThrow("depth limit");
    },
  );
  it("also bounds parenthesis nesting", () => {
    expect(() =>
      braces.compile("(".repeat(3000) + "a" + ")".repeat(3000)),
    ).toThrow(SyntaxError);
  });
  it("preserves ordinary file globs and nested brace expansion", () => {
    expect(braces.expand("src/{app,lib}/**/*.{ts,tsx}")).toEqual([
      "src/app/**/*.ts",
      "src/app/**/*.tsx",
      "src/lib/**/*.ts",
      "src/lib/**/*.tsx",
    ]);
    expect(braces.expand("{a,{b,c}}")).toEqual(["a", "b", "c"]);
  });
});

it.each(["compile", "expand", "stringify"])(
  "bounds externally supplied AST nesting in %s",
  (method) => {
    let node: { type: string; nodes: unknown[] } = { type: "root", nodes: [] };
    for (let i = 0; i < 2000; i++) node = { type: "root", nodes: [node] };
    expect(() => braces[method](node)).toThrow("depth limit");
  },
);
