import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { TrackOrderScreen } from "@/components/orders/track-order-screen";
import { ToastProvider } from "@/components/ui/toast";
import type {
  AssignedRider,
  TrackedOrder,
} from "@/lib/orders/read-tracked-order";

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

// The cancel control reaches for the router and the write; the press itself
// is covered in `cancel-order-control.test.tsx`. `refresh` is shared so the
// rider cases below can see the screen ask the page to re-read.
const routerRefresh = vi.fn();
const router = { push: vi.fn(), refresh: routerRefresh };
// One object, as Next's real `useRouter` returns — a fresh one per render
// would reopen the screen's channel on every render.
vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

// The live map is Leaflet, which needs a real browser (ResizeObserver, a
// laid-out container). Nothing here is about the map, so it is stubbed.
vi.mock("@/components/deliver/delivery-map", () => ({
  DeliveryMap: () => <div data-testid="delivery-map" />,
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
    rider: null,
    items: [],
    ...over,
  };
}

const leo: AssignedRider = {
  riderId: "rider-1",
  name: "Leo Torres",
  photoUrl: null,
  vehicle: "Honda Click 125",
  plate: "ABC 1234",
};

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
  routerRefresh.mockReset();
});

describe("TrackOrderScreen", () => {
  it("renders the order number, the stage headline and the arrival line", () => {
    renderScreen(trackedOrder());

    expect(screen.getByText("Order #0AE7")).toBeInTheDocument();
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

  describe("assigned rider", () => {
    it("shows the rider's name, vehicle and plate once one has accepted", () => {
      renderScreen(trackedOrder({ orderStatus: "preparing", rider: leo }));

      const card = screen.getByRole("region", { name: "Your rider" });
      expect(card).toHaveTextContent("Leo Torres");
      expect(card).toHaveTextContent("Honda Click 125 · ABC 1234");
    });

    it("says no rider is assigned yet before one accepts", () => {
      renderScreen(trackedOrder());

      expect(
        screen.getByRole("region", { name: "Your rider" }),
      ).toHaveTextContent("Rider not assigned yet");
    });

    it("draws initials when the rider has no photo, and the photo when they do", () => {
      const { rerender } = renderScreen(
        trackedOrder({ rider: leo }),
      );
      const card = screen.getByRole("region", { name: "Your rider" });
      expect(card).toHaveTextContent("LT");
      expect(card.querySelector("img")).toBeNull();

      rerender(
        <TrackOrderScreen
          order={trackedOrder({
            rider: { ...leo, photoUrl: "https://x.supabase.co/leo.jpg" },
          })}
        />,
      );
      expect(
        screen.getByRole("region", { name: "Your rider" }).querySelector("img"),
      ).toHaveAttribute("src", "https://x.supabase.co/leo.jpg");
    });

    it("leaves the vehicle line out when nothing is known about the vehicle", () => {
      renderScreen(
        trackedOrder({ rider: { ...leo, vehicle: null, plate: null } }),
      );

      const card = screen.getByRole("region", { name: "Your rider" });
      expect(card).toHaveTextContent("Leo Torres");
      expect(card).not.toHaveTextContent("·");
    });

    it("does not show the card for an order nobody will deliver", () => {
      const { rerender } = renderScreen(trackedOrder({ orderType: "take_out" }));
      expect(
        screen.queryByRole("region", { name: "Your rider" }),
      ).not.toBeInTheDocument();

      rerender(<TrackOrderScreen order={trackedOrder({ orderType: "dine_in" })} />);
      expect(
        screen.queryByRole("region", { name: "Your rider" }),
      ).not.toBeInTheDocument();
    });

    it("still shows an assigned rider whose details could not be read", () => {
      // rider_id is set but the employee row was unreadable: the delivery is
      // assigned, so "not assigned yet" would be false.
      renderScreen(
        trackedOrder({
          rider: { ...leo, name: null, vehicle: null, plate: null },
        }),
      );

      const card = screen.getByRole("region", { name: "Your rider" });
      expect(card).not.toHaveTextContent("Rider not assigned yet");
      expect(card).toHaveTextContent("Your rider");
    });

    it("hides the empty card once the order is cancelled", () => {
      renderScreen(
        trackedOrder({
          orderStatus: "cancelled",
          cancelledAt: "2026-09-13T02:00:00Z",
        }),
      );

      expect(
        screen.queryByRole("region", { name: "Your rider" }),
      ).not.toBeInTheDocument();
    });

    it("asks the page to re-read when a rider accepts over the subscription", () => {
      renderScreen(trackedOrder({ orderStatus: "preparing" }));

      // The rider's name, photo and vehicle live on other tables, so the
      // delivery event alone cannot fill the card — the page re-reads.
      emit("delivery", { delivery_status: "delivering", rider_id: "rider-1" });

      expect(routerRefresh).toHaveBeenCalledTimes(1);
    });

    it("does not re-read on a delivery event that changes nothing about the rider", () => {
      renderScreen(trackedOrder({ orderStatus: "preparing", rider: leo }));

      emit("delivery", { delivery_status: "delivered", rider_id: "rider-1" });

      expect(routerRefresh).not.toHaveBeenCalled();
    });
  });
});
