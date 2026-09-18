import { describe, expect, it } from "vitest";

import { matchesDeliveryTab, resolveDeliveryTab } from "./delivery-status";

describe("delivery tab filtering", () => {
  it("maps pending, delivering, and delivered to the correct tabs", () => {
    expect(resolveDeliveryTab(null)).toBe("all");
    expect(resolveDeliveryTab("pending")).toBe("all");
    expect(resolveDeliveryTab("out_for_delivery")).toBe("queue");
    expect(resolveDeliveryTab("delivering")).toBe("queue");
    expect(resolveDeliveryTab("delivered")).toBe("delivered");
  });

  it("matches the requested tab rules", () => {
    expect(matchesDeliveryTab("pending", "all")).toBe(true);
    expect(matchesDeliveryTab("delivering", "queue")).toBe(true);
    expect(matchesDeliveryTab("delivered", "delivered")).toBe(true);

    expect(matchesDeliveryTab("delivering", "all")).toBe(false);
    expect(matchesDeliveryTab("delivered", "queue")).toBe(false);
    expect(matchesDeliveryTab("pending", "delivered")).toBe(false);
  });
});
