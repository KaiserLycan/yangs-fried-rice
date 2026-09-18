import { describe, expect, it } from "vitest";
import { foldPaymentStatus } from "@/lib/checkout/payment-status";

describe("foldPaymentStatus", () => {
  it("reports nothing when no transaction exists", () => {
    expect(foldPaymentStatus([])).toBeNull();
  });

  it("lets a paid row win over earlier failures", () => {
    expect(
      foldPaymentStatus([
        { payment_status: "failed" },
        { payment_status: "paid" },
      ]),
    ).toBe("paid");
  });

  it("keeps a retry pending even though the first attempt failed", () => {
    expect(
      foldPaymentStatus([
        { payment_status: "failed" },
        { payment_status: "pending" },
      ]),
    ).toBe("pending");
  });

  it("reports a refund as refunded, not as unpaid", () => {
    expect(
      foldPaymentStatus([
        { payment_status: "paid" },
        { payment_status: "refunded" },
      ]),
    ).toBe("paid");
    expect(foldPaymentStatus([{ payment_status: "refunded" }])).toBe(
      "refunded",
    );
  });

  it("reports failed only when every attempt failed", () => {
    expect(foldPaymentStatus([{ payment_status: "failed" }])).toBe("failed");
  });

  it("ignores case and whitespace in stored values", () => {
    expect(foldPaymentStatus([{ payment_status: " Paid " }])).toBe("paid");
  });
});
