import { describe, expect, it } from "vitest";
import { paymongoPaymentUrl } from "@/lib/checkout/paymongo-dashboard";

describe("paymongoPaymentUrl", () => {
  it("opens the payment itself when its id is known", () => {
    expect(paymongoPaymentUrl("pay_abc123XYZ")).toBe(
      "https://dashboard.paymongo.com/payments/pay_abc123XYZ",
    );
  });

  it("falls back to the payments list for anything else", () => {
    expect(paymongoPaymentUrl(null)).toBe("https://dashboard.paymongo.com/payments");
    expect(paymongoPaymentUrl("pay_x/../../evil")).toBe("https://dashboard.paymongo.com/payments");
    expect(paymongoPaymentUrl("javascript:alert(1)")).toBe("https://dashboard.paymongo.com/payments");
  });
});
