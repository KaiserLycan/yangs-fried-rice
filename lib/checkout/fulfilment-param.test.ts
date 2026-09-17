import { describe, expect, it } from "vitest";
import { fulfilmentFromParam, orderTypeFor } from "@/lib/checkout/fulfilment-param";

describe("fulfilmentFromParam", () => {
  it("reads pickup only when the URL says exactly that", () => {
    expect(fulfilmentFromParam("pickup")).toBe("pickup");
  });

  it("lands on delivery for anything else, including nothing", () => {
    expect(fulfilmentFromParam("delivery")).toBe("delivery");
    expect(fulfilmentFromParam("Pickup")).toBe("delivery");
    expect(fulfilmentFromParam(undefined)).toBe("delivery");
  });
});

describe("orderTypeFor", () => {
  // The backend's `order_type` enum has no "pickup"; it calls it take_out.
  it("translates pickup to the backend's take_out", () => {
    expect(orderTypeFor("pickup")).toBe("take_out");
  });

  it("passes delivery through unchanged", () => {
    expect(orderTypeFor("delivery")).toBe("delivery");
  });
});
