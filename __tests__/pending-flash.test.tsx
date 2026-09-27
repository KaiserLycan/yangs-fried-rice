import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { OrderCard } from "@/components/manage/orders/order-card";
import { KdsOrderCard } from "@/components/manage/kds/kds-order-card";
import type { OrderData } from "@/types/staff-order";

/**
 * Issue #115: an order that has waited 5 minutes for staff to accept it
 * flashes on the Orders page and the KDS.
 */

const NOW = new Date("2026-09-28T04:00:00.000Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

function order(pendingAt: string | null): OrderData {
  return {
    id: "o-1",
    orderNumber: "0AE7",
    time: "12:00 PM",
    status: "QUEUE",
    pendingAt,
    items: [{ quantity: 1, name: "Yang Chow", price: 150 }],
    contactInfo: { name: "Liza", address: "—", phone: "—" },
    orderInfo: { type: "Take-Out" },
    deliveryFee: 0,
    total: 150,
  };
}

const flashing = (container: HTMLElement) =>
  container.querySelector("[data-waiting-too-long]") !== null;

describe.each([
  ["Orders page card", (o: OrderData) => <OrderCard order={o} now={NOW} />],
  ["KDS card", (o: OrderData) => <KdsOrderCard order={o} now={NOW} />],
])("%s", (_name, card) => {
  it("does not flash before 5 minutes", () => {
    const { container } = render(card(order(ago(4))));
    expect(flashing(container)).toBe(false);
  });

  it("flashes from 5 minutes unaccepted", () => {
    const { container } = render(card(order(ago(5))));
    expect(flashing(container)).toBe(true);
    expect(container.querySelector(".pending-flash")).not.toBeNull();
  });

  it("does not flash an accepted order", () => {
    const { container } = render(card(order(null)));
    expect(flashing(container)).toBe(false);
  });
});
