import { describe, expect, it } from "vitest";
import { orderCancelledEmail, refundNoteFor } from "./order-cancelled";

describe("orderCancelledEmail", () => {
  it("names the order and the store's reason", () => {
    const email = orderCancelledEmail({
      firstName: "Liza",
      orderNumber: "38206dc0",
      reason: "Out of stock",
      cancelledBy: "store",
      payment: { method: "pay_in_store", status: "pending", amount: 360 },
    });
    expect(email.subject).toBe("Order #38206dc0 was cancelled");
    expect(email.text).toContain("Hi Liza,");
    expect(email.text).toContain("Reason: Out of stock");
    // Nothing was paid, so nothing to refund.
    expect(email.text).not.toMatch(/refund/i);
  });

  it("adds a refund note for a paid wallet order", () => {
    const email = orderCancelledEmail({
      firstName: null,
      orderNumber: "38206dc0",
      reason: null,
      cancelledBy: "store",
      payment: { method: "paymongo", status: "paid", amount: 425 },
    });
    expect(email.text).toContain("You paid ₱425.00 by GCash / Maya");
    expect(email.html).toContain("refund it to the same wallet");
  });

  it("escapes what staff typed before putting it in HTML", () => {
    const email = orderCancelledEmail({
      firstName: "<b>Liza</b>",
      orderNumber: "1",
      reason: `<script>alert("x")</script>`,
      cancelledBy: "store",
      payment: null,
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<b>Liza</b>");
  });

  it("confirms rather than apologises when the customer cancelled", () => {
    const email = orderCancelledEmail({
      firstName: "Liza",
      orderNumber: "1",
      reason: "Customer requested cancellation",
      cancelledBy: "customer",
      payment: null,
    });
    expect(email.text).toContain("has been cancelled, as you asked");
  });
});

describe("refundNoteFor", () => {
  it("says nothing for an unpaid or zero payment", () => {
    expect(refundNoteFor(null)).toBeNull();
    expect(refundNoteFor({ method: "paymongo", status: "failed", amount: 100 })).toBeNull();
    expect(refundNoteFor({ method: "paymongo", status: "paid", amount: 0 })).toBeNull();
  });

  it("sends a counter payment back to the counter", () => {
    expect(refundNoteFor({ method: "pay_in_store", status: "paid", amount: 90 })).toMatch(/Counter 1/);
  });
});
