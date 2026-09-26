import { describe, expect, it } from "vitest";
import { fulfilmentFromParam, orderTypeFor } from "@/lib/checkout/fulfilment-param";

// Pickup-only (issue #114): the URL can no longer choose delivery.
describe("fulfilmentFromParam", () => {
  it("reads pickup whatever the URL says, including nothing", () => {
    expect(fulfilmentFromParam("pickup")).toBe("pickup");
    expect(fulfilmentFromParam("delivery")).toBe("pickup");
    expect(fulfilmentFromParam(undefined)).toBe("pickup");
  });
});

describe("orderTypeFor", () => {
  // The backend's `order_type` enum has no "pickup"; it calls it take_out.
  it("always submits take_out", () => {
    expect(orderTypeFor("pickup")).toBe("take_out");
    expect(orderTypeFor("delivery")).toBe("take_out");
  });
});
