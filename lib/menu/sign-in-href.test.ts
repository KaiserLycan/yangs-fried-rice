import { describe, expect, it } from "vitest";
import { itemParam, signInToOrderHref } from "./sign-in-href";
import { safeNextPath } from "@/lib/auth/safe-next";

const ID = "38206dc0-b033-4453-864c-b7c487862c7c";

describe("signInToOrderHref", () => {
  it("comes back to the same dish after signing in", () => {
    const href = signInToOrderHref(ID);
    const next = new URL(href, "https://shop.example").searchParams.get("next");
    expect(next).toBe(`/menu?item=${ID}`);
    // and login's own guard lets it through
    expect(safeNextPath(next)).toBe(`/menu?item=${ID}`);
  });

  it("falls back to the menu without a dish", () => {
    expect(signInToOrderHref()).toBe("/login?next=%2Fmenu");
  });
});

describe("itemParam", () => {
  it("accepts a product id and nothing else", () => {
    expect(itemParam(ID)).toBe(ID);
    expect(itemParam([ID, "x"])).toBe(ID);
    expect(itemParam("<script>")).toBeNull();
    expect(itemParam(undefined)).toBeNull();
  });
});
