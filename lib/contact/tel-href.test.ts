import { describe, expect, it } from "vitest";
import { telHref } from "@/lib/contact/tel-href";

describe("telHref", () => {
  it("keeps the digits and a leading plus", () => {
    expect(telHref("0917 123 4567")).toBe("tel:09171234567");
    expect(telHref(" +63 917-123-4567 ")).toBe("tel:+639171234567");
  });

  it("cannot be turned into another scheme", () => {
    expect(telHref("javascript:alert(1)")).toBe("tel:1");
  });
});
