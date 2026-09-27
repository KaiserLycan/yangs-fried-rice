import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it("keeps a path on this site", () => {
    expect(safeNextPath("/menu")).toBe("/menu");
    expect(safeNextPath("/orders/abc?x=1")).toBe("/orders/abc?x=1");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "menu",
    // Browsers drop tabs and newlines inside a URL, so this becomes
    // //evil.example once followed.
    "/\t/evil.example",
  ])("refuses %j", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });

  it("uses the fallback when there is nothing", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("", "/menu")).toBe("/menu");
  });
});
