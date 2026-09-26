import { describe, expect, it } from "vitest";
import {
  canCancel,
  dbStatusFor,
  primaryActionFor,
  statusLabelFor,
} from "./staff-actions";
import { isValidTransition, type OrderStatus } from "@/lib/validation/orders";

describe("statusLabelFor", () => {
  it("calls a take-out order in the last stage 'Ready for Pick Up', never 'Delivering'", () => {
    expect(statusLabelFor({ status: "DELIVERY", isDelivery: false })).toBe("READY FOR PICK UP");
  });

  it("calls a delivery order in the last stage 'Delivering'", () => {
    expect(statusLabelFor({ status: "DELIVERY", isDelivery: true })).toBe("DELIVERING");
  });
});

describe("primaryActionFor", () => {
  // Pickup-only (issue #114): nothing is sent out, whatever the order type.
  it("marks every order ready for pick up from prep, even a legacy delivery", () => {
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
  it("only cancels orders still in the queue or in prep", () => {
    expect(canCancel({ status: "QUEUE" })).toBe(true);
    expect(canCancel({ status: "PREP" })).toBe(true);
    expect(canCancel({ status: "DELIVERY" })).toBe(false);
  });
});
