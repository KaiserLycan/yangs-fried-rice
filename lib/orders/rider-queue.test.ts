import { describe, expect, it } from "vitest";
import { compareQueue, queueRank, toDeliveryCard, type QueueDetail } from "./rider-queue";

const detail = (deliveryStatus: string | null): QueueDetail => ({
  deliveryId: "d-1",
  orderId: "69403b15-bec1-43f1-a3ad-47a484655630",
  deliveryStatus,
  createdAt: null,
  customer: null,
  payment: null,
  items: [],
  deliveryNote: null,
});

describe("toDeliveryCard", () => {
  it("never offers Accept on a delivery this rider already holds", () => {
    const card = toDeliveryCard(
      detail("assigned"),
      { deliveryId: "d-1", deliveryStatus: "assigned", isMine: true, takenBy: null },
      1,
    );
    expect(card.status).toBe("delivering");
  });

  it("marks another rider's delivery as taken", () => {
    const card = toDeliveryCard(
      detail("assigned"),
      { deliveryId: "d-1", deliveryStatus: "assigned", isMine: false, takenBy: "Jerome" },
      0,
    );
    expect(card.takenBy).toBe("Jerome");
  });

  it("shows the order's number, not the delivery's (P52)", () => {
    const card = toDeliveryCard(detail("pending"), undefined, 0);
    expect(card.orderNumber).toBe("69403b15");
  });
});

describe("compareQueue", () => {
  it("keeps the groups and puts the newest first inside one (P53)", () => {
    const older = { deliveryId: "a", deliveryStatus: "pending", isMine: false, takenBy: null, createdAt: "2026-09-26T01:00:00Z" };
    const newer = { ...older, deliveryId: "b", createdAt: "2026-09-26T02:00:00Z" };
    const mine = { ...older, deliveryId: "c", isMine: true, createdAt: "2026-09-25T00:00:00Z" };
    expect([older, newer, mine].sort(compareQueue).map((s) => s.deliveryId)).toEqual(["c", "b", "a"]);
  });
});

describe("queueRank", () => {
  it("puts own, then open, then other riders', then finished", () => {
    const own = queueRank({ deliveryId: "a", deliveryStatus: "delivering", isMine: true, takenBy: null });
    const open = queueRank({ deliveryId: "b", deliveryStatus: "pending", isMine: false, takenBy: null });
    const taken = queueRank({ deliveryId: "c", deliveryStatus: "delivering", isMine: false, takenBy: "X" });
    const done = queueRank({ deliveryId: "d", deliveryStatus: "delivered", isMine: true, takenBy: null });
    expect([own, open, taken, done]).toEqual([0, 1, 2, 3]);
  });
});
