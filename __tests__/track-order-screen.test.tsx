import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { TrackOrderScreen } from "@/components/orders/track-order-screen";
import { ToastProvider } from "@/components/ui/toast";
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

// The cancel control reaches for the router and the write; neither is
// exercised here — `cancel-order-control.test.tsx` covers the press.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/actions/cart", () => ({
  cancelCustomerOrder: vi.fn(),
}));

// The ETA is re-asked on every status event. Each test decides what the
// backend answers; the default is a fresh, shorter window.
const getOrderEtaAction = vi.fn();
vi.mock("@/lib/actions/eta", () => ({
  getOrderEtaAction: (...args: unknown[]) => getOrderEtaAction(...args),
}));

function etaOf(arrivalWindow: string) {
  return { success: true, data: { arrivalWindow } };
}

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
    // What `submitCart` writes. The back office's "received" is the same
    // stage but means staff have accepted, which withdraws Cancel order.
    orderStatus: "pending",
    cancelledAt: null,
    cancellationReason: null,
    deliveryStatus: null,
    deliveryId: null,
    orderType: "Delivery",
    arrivalWindow: "35–45 min",
    destination: "21 Mabini St",
    destinationCoordinates: null,
    riderName: null,
    items: [],
    rating: null,
    ...over,
  };
}

/**
 * The screen renders the cancel control, whose toast throws rather than
 * no-oping when no provider is above it — so every render here gets one, the
 * same way the page does.
 */
function renderScreen(order: TrackedOrder) {
  return render(<TrackOrderScreen order={order} />, { wrapper: ToastProvider });
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
  getOrderEtaAction.mockReset();
  getOrderEtaAction.mockResolvedValue(etaOf("20–30 mins"));
});

describe("TrackOrderScreen", () => {
  it("renders the order number, the stage headline and the arrival line", () => {
    renderScreen(trackedOrder());

    // "Order" and the reference are separate spans since issue #106: the
    // whole order id is shown now, and it is set monospaced and breakable
    // while the word before it keeps the label's letter-spacing.
    expect(screen.getByText("#0AE7")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "WAITING FOR THE KITCHEN" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Arriving 35–45 min · Delivery to 21 Mabini St"),
    ).toBeInTheDocument();
  });

  it("renders all four stages exactly once, at both breakpoints", () => {
    renderScreen(trackedOrder());

    // One DOM tree, not one per breakpoint — a second copy would read the
    // whole order twice to a screen reader.
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(stageStates()).toEqual(["Now", "—", "—", "—"]);
  });

  it("says something deliberate when the status is NULL rather than going blank", () => {
    renderScreen(trackedOrder({ orderStatus: null }));

    expect(screen.getByRole("heading", { level: 1 }).textContent).not.toBe("");
    expect(stageStates()).toEqual(["—", "—", "—", "—"]);
  });

  it("falls back to a neutral arrival line when nothing has been estimated", () => {
    renderScreen(trackedOrder({ arrivalWindow: null }));

    expect(
      screen.getByText("Arrival time to be confirmed · Delivery to 21 Mabini St"),
    ).toBeInTheDocument();
  });

  it("moves the screen when the order row changes, with no refetch", () => {
    renderScreen(trackedOrder());
    expect(stageStates()).toEqual(["Now", "—", "—", "—"]);

    emit("order", { order_status: "preparing", cancelled_at: null });

    expect(stageStates()).toEqual(["Done", "Now", "—", "—"]);
    expect(
      screen.getByRole("heading", { name: "IN THE WOK NOW" }),
    ).toBeInTheDocument();
  });

  it("moves the screen when the delivery row changes", () => {
    renderScreen(trackedOrder({ orderStatus: "preparing" }));

    // The realistic case: completing a delivery deliberately leaves
    // order_status alone, so only the delivery row moves.
    emit("delivery", { delivery_status: "delivered" });

    expect(stageStates()).toEqual(["Done", "Done", "Done", "Now"]);
  });

  it("reacts to a cancellation arriving over the subscription", () => {
    renderScreen(trackedOrder());

    emit("order", {
      order_status: "cancelled",
      cancelled_at: "2026-09-13T02:00:00Z",
    });

    expect(stageStates()).toEqual(["—", "—", "—", "—"]);
  });

  it("tells the customer when the kitchen cancels, even with no reason (P28)", () => {
    renderScreen(trackedOrder());

    // The kitchen's cancel writes a timestamp and no reason.
    emit("order", {
      order_status: "cancelled",
      cancelled_at: "2026-09-13T02:00:00Z",
      cancellation_reason: null,
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The restaurant cancelled this order.",
    );
    // A cancelled order is not arriving, so no arrival line either.
    expect(screen.queryByText(/Arriving/)).not.toBeInTheDocument();
  });

  it("offers one order rating once delivered, and none once rated (P35, P37)", () => {
    const delivered = trackedOrder({
      orderStatus: "completed",
      deliveryStatus: "delivered",
    });
    const { rerender } = renderScreen(delivered);
    expect(
      screen.getByRole("button", { name: /Rate order/ }),
    ).toBeInTheDocument();

    rerender(<TrackOrderScreen order={{ ...delivered, rating: 4 }} />);
    expect(
      screen.queryByRole("button", { name: /Rate order/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Rated 4 out of 5")).toBeInTheDocument();
  });

  it("offers the cancel control only while the kitchen has not confirmed", () => {
    const { rerender } = renderScreen(trackedOrder());
    expect(
      screen.getByRole("button", { name: "Cancel order" }),
    ).toBeInTheDocument();

    // Staff accepted: same "Order received" stage, but the backend will no
    // longer cancel it, so the note shows in place of the button.
    rerender(
      <TrackOrderScreen order={trackedOrder({ orderStatus: "received" })} />,
    );
    expect(
      screen.queryByRole("button", { name: "Cancel order" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/no longer be changed or cancelled/)).toBeInTheDocument();
    expect(stageStates()).toEqual(["Now", "—", "—", "—"]);

    rerender(
      <TrackOrderScreen order={trackedOrder({ orderStatus: "preparing" })} />,
    );
    expect(
      screen.queryByRole("button", { name: "Cancel order" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/no longer be changed or cancelled/)).toBeInTheDocument();
  });

  it("withdraws the cancel control when the kitchen confirms over the subscription", () => {
    renderScreen(trackedOrder());

    emit("order", { order_status: "preparing", cancelled_at: null });

    // The whole reason this screen subscribes: the control has to go away
    // without a refresh, not stay pressable until the customer reloads.
    expect(
      screen.queryByRole("button", { name: "Cancel order" }),
    ).not.toBeInTheDocument();
  });

  it("re-asks the ETA when the order moves and shows the new window", async () => {
    renderScreen(trackedOrder());
    expect(getOrderEtaAction).not.toHaveBeenCalled();

    emit("order", { order_status: "preparing", cancelled_at: null });

    expect(getOrderEtaAction).toHaveBeenCalledWith(
      "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    );
    await waitFor(() =>
      expect(
        screen.getByText("Arriving 20–30 mins · Delivery to 21 Mabini St"),
      ).toBeInTheDocument(),
    );
  });

  it("re-asks the ETA when the delivery moves", async () => {
    getOrderEtaAction.mockResolvedValue(etaOf("5–10 mins"));
    renderScreen(trackedOrder({ orderStatus: "preparing" }));

    emit("delivery", { delivery_status: "out_for_delivery" });

    await waitFor(() =>
      expect(screen.getByText(/Arriving 5–10 mins/)).toBeInTheDocument(),
    );
  });

  it("shows the fallback when the backend refuses the estimate", async () => {
    getOrderEtaAction.mockResolvedValue({ success: false, error: "Order not found." });
    renderScreen(trackedOrder());

    emit("order", { order_status: "preparing", cancelled_at: null });

    // A refusal is an answer, unlike a thrown call: the old "35–45 min" is
    // no longer known to be current, so the fallback replaces it.
    await waitFor(() =>
      expect(screen.getByText(/Arrival time to be confirmed/)).toBeInTheDocument(),
    );
  });

  it("keeps the last window when the ETA call throws", async () => {
    getOrderEtaAction.mockRejectedValue(new Error("network"));
    renderScreen(trackedOrder());

    emit("order", { order_status: "preparing", cancelled_at: null });

    await waitFor(() => expect(getOrderEtaAction).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/Arriving 35–45 min/)).toBeInTheDocument();
  });

  it("says it is working while the first estimate is on its way", async () => {
    let answer: (value: unknown) => void = () => {};
    getOrderEtaAction.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    renderScreen(trackedOrder({ arrivalWindow: null }));

    emit("order", { order_status: "preparing", cancelled_at: null });

    expect(screen.getByText(/Updating arrival time…/)).toBeInTheDocument();
    await act(async () => answer(etaOf("25–35 mins")));
    expect(screen.getByText(/Arriving 25–35 mins/)).toBeInTheDocument();
  });

  it("does not let a slow reply overwrite a newer one", async () => {
    let answerFirst: (value: unknown) => void = () => {};
    getOrderEtaAction
      .mockReturnValueOnce(new Promise((resolve) => (answerFirst = resolve)))
      .mockResolvedValueOnce(etaOf("10–15 mins"));
    renderScreen(trackedOrder());

    emit("order", { order_status: "preparing", cancelled_at: null });
    emit("delivery", { delivery_status: "out_for_delivery" });

    await waitFor(() =>
      expect(screen.getByText(/Arriving 10–15 mins/)).toBeInTheDocument(),
    );
    await act(async () => answerFirst(etaOf("40–50 mins")));
    expect(screen.getByText(/Arriving 10–15 mins/)).toBeInTheDocument();
  });

  it("closes its channel when the screen goes away", () => {
    const { unmount } = renderScreen(trackedOrder());
    unmount();

    expect(channelsRemoved).toBe(1);
  });
});
