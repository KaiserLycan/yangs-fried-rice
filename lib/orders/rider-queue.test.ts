import { describe, expect, it } from "vitest";
import { queueRank, toDeliveryCard, type QueueDetail } from "./rider-queue";

const detail = (deliveryStatus: string | null): QueueDetail => ({
  deliveryId: "d-1",
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
