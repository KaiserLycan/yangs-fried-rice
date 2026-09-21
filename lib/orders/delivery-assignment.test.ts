import { describe, expect, it } from "vitest";
import {
  canAcceptDelivery,
  canReleaseDelivery,
  isDeliveryFinished,
  releaseRefusalReason,
} from "./delivery-assignment";

const ME = "rider-1";
const SOMEONE_ELSE = "rider-2";

describe("canAcceptDelivery", () => {
  it("accepts one nobody has taken", () => {
    expect(canAcceptDelivery({ assignedRiderId: null, status: "pending" })).toBe(true);
  });

  it("refuses one another rider is already carrying", () => {
    expect(
      canAcceptDelivery({ assignedRiderId: SOMEONE_ELSE, status: "delivering" }),
    ).toBe(false);
  });

  it("refuses one that is already finished", () => {
    expect(canAcceptDelivery({ assignedRiderId: null, status: "delivered" })).toBe(false);
  });
});

describe("canReleaseDelivery", () => {
  it("lets the rider carrying it hand it back", () => {
    expect(
      canReleaseDelivery({ assignedRiderId: ME, status: "delivering" }, ME),
    ).toBe(true);
  });

  it("reads free-text statuses the same however they are spelled", () => {
    expect(
      canReleaseDelivery({ assignedRiderId: ME, status: "Out For Delivery" }, ME),
    ).toBe(true);
    expect(
      canReleaseDelivery({ assignedRiderId: ME, status: "Delivered" }, ME),
    ).toBe(false);
  });

  it("still allows it when the status was never set", () => {
    expect(canReleaseDelivery({ assignedRiderId: ME, status: null }, ME)).toBe(true);
  });

  it("refuses once it has been delivered", () => {
    expect(
      canReleaseDelivery({ assignedRiderId: ME, status: "delivered" }, ME),
    ).toBe(false);
  });

  it("refuses another rider's delivery", () => {
    expect(
      canReleaseDelivery({ assignedRiderId: SOMEONE_ELSE, status: "delivering" }, ME),
    ).toBe(false);
  });

  it("refuses one nobody has accepted", () => {
    expect(canReleaseDelivery({ assignedRiderId: null, status: "pending" }, ME)).toBe(false);
  });
});

describe("a handed-back delivery is free again", () => {
  it("can be accepted by any rider, including the one who released it", () => {
    // What the release writes: no rider, waiting.
    const released = { assignedRiderId: null, status: "pending" };
    expect(canAcceptDelivery(released)).toBe(true);
    expect(canReleaseDelivery(released, ME)).toBe(false);
  });
});

describe("releaseRefusalReason", () => {
  it("says nothing when the release is allowed", () => {
    expect(releaseRefusalReason({ assignedRiderId: ME, status: "delivering" }, ME)).toBeNull();
  });

  it("explains each refusal", () => {
    expect(releaseRefusalReason({ assignedRiderId: ME, status: "delivered" }, ME)).toMatch(
      /already finished/i,
    );
    expect(releaseRefusalReason({ assignedRiderId: null, status: "pending" }, ME)).toMatch(
      /haven't accepted/i,
    );
    expect(
      releaseRefusalReason({ assignedRiderId: SOMEONE_ELSE, status: "delivering" }, ME),
    ).toMatch(/another rider/i);
  });
});

describe("isDeliveryFinished", () => {
  it.each(["delivered", "completed", "failed", "cancelled", "canceled"])(
    "treats %s as finished",
    (status) => {
      expect(isDeliveryFinished({ assignedRiderId: ME, status })).toBe(true);
    },
  );

  it.each(["pending", "delivering", "out_for_delivery", null])(
    "treats %s as still in flight",
    (status) => {
      expect(isDeliveryFinished({ assignedRiderId: ME, status })).toBe(false);
    },
  );
});
