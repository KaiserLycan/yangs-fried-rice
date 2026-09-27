import { describe, expect, it } from "vitest";
import {
  canCancel,
  dbStatusFor,
  primaryActionFor,
  statusLabelFor,
} from "./staff-actions";
import { isValidTransition, type OrderStatus } from "@/lib/validation/orders";

describe("statusLabelFor", () => {
  // The customer's stage names (docs/copy-glossary.md), so staff and
  // customer say the same thing about the same order.
  it("names each stage the way the customer's timeline does", () => {
    expect(statusLabelFor({ status: "QUEUE", isDelivery: false })).toBe("RECEIVED");
    expect(statusLabelFor({ status: "PREP", isDelivery: false })).toBe("PREPARING");
    expect(statusLabelFor({ status: "DELIVERY", isDelivery: false })).toBe("READY FOR PICKUP");
    expect(statusLabelFor({ status: "COMPLETED", isDelivery: false })).toBe("PICKED UP");
    expect(statusLabelFor({ status: "CANCELED", isDelivery: false })).toBe("CANCELLED");
  });

  it("calls a legacy delivery order still out 'Out for delivery'", () => {
    expect(statusLabelFor({ status: "DELIVERY", isDelivery: true })).toBe("OUT FOR DELIVERY");
  });
});

describe("primaryActionFor", () => {
  // Pickup-only (issue #114): nothing is sent out, whatever the order type.
  it("marks every order ready for pickup from prep, even a legacy delivery", () => {
    expect(primaryActionFor({ status: "PREP", isDelivery: false })?.type).toBe("Ready");
    expect(primaryActionFor({ status: "PREP", isDelivery: true })?.type).toBe("Ready");
  });

  it("lets staff finish every order — there are no riders to do it", () => {
    expect(primaryActionFor({ status: "DELIVERY", isDelivery: false })?.type).toBe("Complete");
    expect(primaryActionFor({ status: "DELIVERY", isDelivery: true })?.type).toBe("Complete");
  });

  it("has no action for finished orders", () => {
    expect(primaryActionFor({ status: "COMPLETED", isDelivery: false })).toBeNull();
    expect(primaryActionFor({ status: "CANCELED", isDelivery: true })).toBeNull();
  });
});

describe("dbStatusFor", () => {
  it("only ever writes transitions the order pipeline allows", () => {
    const steps: [OrderStatus, ReturnType<typeof dbStatusFor>][] = [
      ["pending", dbStatusFor("Confirm")],
      ["preparing", dbStatusFor("Ready")],
      ["ready", dbStatusFor("Complete")],
      ["out_for_delivery", dbStatusFor("Complete")],
      ["preparing", dbStatusFor("Cancel")],
    ];
    for (const [from, to] of steps) {
      expect(isValidTransition(from, to as OrderStatus)).toBe(true);
    }
  });
});

describe("canCancel", () => {
  it("only cancels orders still unpaid, in the queue or in prep", () => {
    expect(canCancel({ status: "UNPAID" })).toBe(true);
    expect(canCancel({ status: "QUEUE" })).toBe(true);
    expect(canCancel({ status: "PREP" })).toBe(true);
    expect(canCancel({ status: "DELIVERY" })).toBe(false);
  });
});

describe("unpaid orders", () => {
  it("have no forward action until the payment lands", () => {
    expect(primaryActionFor({ status: "UNPAID" })).toBeNull();
    expect(statusLabelFor({ status: "UNPAID" })).toBe("UNPAID");
  });
});
