import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { TrackOrderScreen } from "@/components/orders/track-order-screen";
import type { TrackedOrder } from "@/lib/orders/read-tracked-order";

/**
 * `TrackOrderScreen`'s populated state has no honest way to reach a real
 * browser today: no customer has an order, because placing one is still a
 * stubbed write. These fixture-backed tests are what stands in, the same
 * reasoning `cart-contents.test.tsx` already uses.
 *
 * The live-update cases matter more than usual here. Ticket 06 asks that a
 * status change on either table move the screen with no refresh, and that is
 * a timing behaviour inside an effect — nothing about it is visible in a
 * static render, so eyeballing the screen could never confirm it.
 */

/**
 * A Supabase client stub that keeps the handlers the screen registers, so a
 * test can fire a row change by hand. `on()` returns the channel so the real
 * chained `.on().on().subscribe()` call works unchanged.
 */
type Handler = (payload: { new?: Record<string, unknown> }) => void;
let handlers: { table: string; handler: Handler }[] = [];
let channelsRemoved = 0;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => {
      const channel = {
        on: (
          _event: string,
          config: { table: string },
          handler: Handler,
        ) => {
          handlers.push({ table: config.table, handler });
          return channel;
        },
        subscribe: () => channel,
      };
      return channel;
    },
    removeChannel: () => {
      channelsRemoved += 1;
    },
  }),
}));

function emit(table: string, row: Record<string, unknown>) {
  act(() => {
    for (const entry of handlers) {
      if (entry.table === table) entry.handler({ new: row });
    }
  });
}

function trackedOrder(over: Partial<TrackedOrder> = {}): TrackedOrder {
  return {
    orderId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    orderNumber: "0AE7",
    orderStatus: "received",
    cancelledAt: null,
    deliveryStatus: null,
    deliveryId: null,
    orderType: "Delivery",
    arrivalWindow: "35–45 min",
    destination: "21 Mabini St",
    riderName: null,
    ...over,
  };
}

/** The Done / Now / — line under each stage label, in timeline order. */
function stageStates() {
  return screen
    .getAllByRole("listitem")
    .map((item) => item.textContent?.match(/(Done|Now|—)/)?.[1] ?? "");
}

beforeEach(() => {
  handlers = [];
  channelsRemoved = 0;
});

describe("TrackOrderScreen", () => {
  it("renders the order number, the stage headline and the arrival line", () => {
    render(<TrackOrderScreen order={trackedOrder()} />);

    expect(screen.getByText("Order #0AE7")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "WAITING FOR THE KITCHEN" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Arriving 35–45 min · Delivery to 21 Mabini St"),
    ).toBeInTheDocument();
  });

  it("renders all four stages exactly once, at both breakpoints", () => {
    render(<TrackOrderScreen order={trackedOrder()} />);

    // One DOM tree, not one per breakpoint — a second copy would read the
    // whole order twice to a screen reader.
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(stageStates()).toEqual(["Now", "—", "—", "—"]);
  });

  it("says something deliberate when the status is NULL rather than going blank", () => {
    render(<TrackOrderScreen order={trackedOrder({ orderStatus: null })} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).not.toBe("");
    expect(stageStates()).toEqual(["—", "—", "—", "—"]);
  });

  it("falls back to a neutral arrival line when nothing has been estimated", () => {
    render(<TrackOrderScreen order={trackedOrder({ arrivalWindow: null })} />);

    expect(
      screen.getByText("Arrival time to be confirmed · Delivery to 21 Mabini St"),
    ).toBeInTheDocument();
  });

  it("moves the screen when the order row changes, with no refetch", () => {
    render(<TrackOrderScreen order={trackedOrder()} />);
    expect(stageStates()).toEqual(["Now", "—", "—", "—"]);

    emit("order", { order_status: "preparing", cancelled_at: null });

    expect(stageStates()).toEqual(["Done", "Now", "—", "—"]);
    expect(
      screen.getByRole("heading", { name: "IN THE WOK NOW" }),
    ).toBeInTheDocument();
  });

  it("moves the screen when the delivery row changes", () => {
    render(<TrackOrderScreen order={trackedOrder({ orderStatus: "preparing" })} />);

    // The realistic case: completing a delivery deliberately leaves
    // order_status alone, so only the delivery row moves.
    emit("delivery", { delivery_status: "delivered" });

    expect(stageStates()).toEqual(["Done", "Done", "Done", "Now"]);
  });

  it("reacts to a cancellation arriving over the subscription", () => {
    render(<TrackOrderScreen order={trackedOrder()} />);

    emit("order", {
      order_status: "cancelled",
      cancelled_at: "2026-09-13T02:00:00Z",
    });

    expect(stageStates()).toEqual(["—", "—", "—", "—"]);
  });

  it("tells the cancel slot whether cancelling is still allowed", () => {
    const slot = vi.fn(() => <button type="button">Cancel order</button>);

    const { rerender } = render(
      <TrackOrderScreen order={trackedOrder()} cancelSlot={slot} />,
    );
    expect(slot).toHaveBeenLastCalledWith(true);

    rerender(
      <TrackOrderScreen
        order={trackedOrder({ orderStatus: "preparing" })}
        cancelSlot={slot}
      />,
    );
    expect(slot).toHaveBeenLastCalledWith(false);
  });

  it("leaves no cancel slot rendered when the ticket that owns it passes none", () => {
    render(<TrackOrderScreen order={trackedOrder()} />);

    expect(screen.queryByText("Cancel order")).not.toBeInTheDocument();
  });

  it("closes its channel when the screen goes away", () => {
    const { unmount } = render(<TrackOrderScreen order={trackedOrder()} />);
    unmount();

    expect(channelsRemoved).toBe(1);
  });
});
