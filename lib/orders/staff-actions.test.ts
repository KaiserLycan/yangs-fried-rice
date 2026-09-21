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
  it("sends a delivery order out for delivery from prep", () => {
    expect(primaryActionFor({ status: "PREP", isDelivery: true })?.type).toBe("Deliver");
  });

  it("marks a take-out order ready for pick up from prep", () => {
    expect(primaryActionFor({ status: "PREP", isDelivery: false })?.type).toBe("Ready");
  });

  it("lets staff finish a take-out order, but leaves a delivery to the rider", () => {
    expect(primaryActionFor({ status: "DELIVERY", isDelivery: false })?.type).toBe("Complete");
    expect(primaryActionFor({ status: "DELIVERY", isDelivery: true })).toBeNull();
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
      ["preparing", dbStatusFor("Deliver")],
      ["preparing", dbStatusFor("Ready")],
      ["ready", dbStatusFor("Complete")],
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
