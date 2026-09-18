import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MenuScreen } from "@/components/menu/menu-screen";
import { ToastProvider } from "@/components/ui/toast";
import { fetchCategories, fetchProducts } from "@/lib/menu/fetch-menu";
import type { ProductListing } from "@/lib/menu/product-listing";

/**
 * Regression tests for the three faults Copilot found on PR #29. All three
 * are timing faults in `MenuScreen`'s effects rather than anything visible in
 * a static render, so none of them could be caught by eyeballing the screen —
 * which is why they survived the manual pass ticket 02 signed off with.
 */

vi.mock("@/lib/menu/fetch-menu", () => ({
  fetchProducts: vi.fn(),
  fetchCategories: vi.fn(),
}));

// `ItemDetailModal` reaches for the router and the cart write on mount; none
// of these tests open it, so both are inert stubs.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/actions/cart", () => ({
  addCartItem: vi.fn(),
}));

/**
 * A Supabase client stub that records how many times a channel was opened, so
 * the resubscribe-churn test has something to count. `on()` returns the
 * channel so the real chained `.on().on().subscribe()` call works unchanged.
 */
let channelsOpened = 0;
let channelsRemoved = 0;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => {
      channelsOpened += 1;
      const channel = {
        on: () => channel,
        subscribe: () => channel,
      };
      return channel;
    },
    removeChannel: () => {
      channelsRemoved += 1;
    },
  }),
}));

function dish(name: string): ProductListing {
  return {
    id: name,
    name,
    description: "",
    price: 180,
    categoryName: null,
    isAvailable: true,
  };
}

/** A promise plus the handles to settle it later, so a test can order two
 *  in-flight requests against each other by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const MOCK_PRODUCTS = [dish("Yang Special Fried Rice")];
const MOCK_CATEGORIES = [{ id: "1", name: "Yang's Rice" }];

function renderScreen() {
  return render(
    <ToastProvider>
      <MenuScreen
        profilePromise={Promise.resolve(null)}
        productsPromise={Promise.resolve(MOCK_PRODUCTS)}
        categoriesPromise={Promise.resolve(MOCK_CATEGORIES)}
        cartPromise={Promise.resolve({ cartId: null, lines: [] })}
      />
    </ToastProvider>,
  );
}

/** Type into the desktop search field. Both fields are controlled by the same
 *  state, so either one drives the whole screen. */
function typeSearch(value: string) {
  const [field] = screen.getAllByRole("searchbox");
  fireEvent.change(field, { target: { value } });
}

/**
 * How many times a dish is on screen.
 *
 * Every dish renders twice: once as a desktop `ProductCard` and once as a
 * mobile `ProductRow`. Only one of the two is visible at any width, but both
 * are in the DOM because the breakpoint is CSS, so these tests count
 * occurrences rather than expecting a single element.
 */
function dishCount(name: string) {
  return screen.queryAllByText(name).length;
}

beforeEach(() => {
  channelsOpened = 0;
  channelsRemoved = 0;
  vi.mocked(fetchCategories).mockResolvedValue([
    { id: "1", name: "Yang's Rice" },
  ]);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("MenuScreen search races", () => {
  // Copilot, PR #29: "a slower request from an older search/category can
  // resolve after a newer one and overwrite the latest results."
  it("ignores a stale response that lands after a newer one", async () => {
    const first = deferred<ProductListing[]>();
    const second = deferred<ProductListing[]>();
    vi.mocked(fetchProducts)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    renderScreen();

    typeSearch("chow");
    await waitFor(() => expect(fetchProducts).toHaveBeenCalledTimes(1));

    typeSearch("chow fan");
    await waitFor(() => expect(fetchProducts).toHaveBeenCalledTimes(2));

    // The newer request answers first, then the older one straggles in.
    second.resolve([dish("Yang's Chow Fan")]);
    await waitFor(() =>
      expect(dishCount("Yang's Chow Fan")).toBeGreaterThan(0),
    );

    first.resolve([dish("Stale Adobo")]);

    await waitFor(() => expect(dishCount("Stale Adobo")).toBe(0));
    expect(dishCount("Yang's Chow Fan")).toBeGreaterThan(0);
  });

  // Copilot, PR #29: "fetchProducts errors currently go unhandled."
  it("tells the customer when a search fails instead of rejecting silently", async () => {
    vi.mocked(fetchProducts).mockRejectedValue(new Error("500"));

    renderScreen();
    typeSearch("chow");

    expect(await screen.findByText(/couldn't be updated/i)).toBeInTheDocument();
    // The previous results stay on screen — a failed refresh should not blank
    // the menu out from under someone who is reading it.
    expect(dishCount("Yang Special Fried Rice")).toBeGreaterThan(0);
  });
});

describe("MenuScreen realtime subscription", () => {
  // Copilot, PR #29: "This Realtime subscription re-subscribes on every
  // search/category change ... can churn WebSocket subscriptions while typing
  // and risks briefly missing events."
  it("keeps one channel open while the customer types", async () => {
    vi.mocked(fetchProducts).mockResolvedValue([dish("Yang's Chow Fan")]);

    renderScreen();
    expect(channelsOpened).toBe(1);

    typeSearch("c");
    typeSearch("ch");
    typeSearch("cho");
    typeSearch("chow");

    await waitFor(() => expect(fetchProducts).toHaveBeenCalled());

    expect(channelsOpened).toBe(1);
    expect(channelsRemoved).toBe(0);
  });
});
