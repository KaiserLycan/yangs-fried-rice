import { beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackStoreStatus, type StoreStatus } from "@/lib/store/store-status";

/**
 * submitCart's store check (issue #115): closed, paused or busy is refused
 * before the database is asked, with the wording the menu banner uses, and
 * the database's own refusal (hint → code) still reaches the customer.
 */

const rpc = vi.fn();
const readStoreStatus = vi.fn<() => Promise<StoreStatus>>();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "customer-1" } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { customer_id: "customer-1", is_account_disabled: false },
          }),
        }),
      }),
    }),
    rpc,
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/store/read-store-status", () => ({
  readStoreStatus: () => readStoreStatus(),
}));

import { submitCart } from "./cart";

const CART_ID = "0b6f3f7e-8c2e-4c1a-9f0e-3b1a2c4d5e6f";

function open(overrides: Partial<StoreStatus> = {}): StoreStatus {
  return { ...fallbackStoreStatus(), isOpen: true, ...overrides };
}

beforeEach(() => {
  rpc.mockReset();
  readStoreStatus.mockReset();
});

describe("submitCart store check", () => {
  it("refuses when closed, without calling the database", async () => {
    readStoreStatus.mockResolvedValue(open({ isOpen: false, openHour: 8 }));

    const result = await submitCart({ cart_id: CART_ID } as never);

    expect(result).toEqual({
      data: null,
      error: "We're closed right now. We open at 8:00 AM.",
      code: "STORE_CLOSED",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses when paused", async () => {
    readStoreStatus.mockResolvedValue(open({ isPaused: true }));

    const result = await submitCart({ cart_id: CART_ID } as never);

    expect(result.error).toBe("We're very busy right now. Please try again in a few minutes.");
    expect("code" in result && result.code).toBe("STORE_PAUSED");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses when busy", async () => {
    readStoreStatus.mockResolvedValue(open({ isBusy: true }));

    const result = await submitCart({ cart_id: CART_ID } as never);

    expect("code" in result && result.code).toBe("STORE_BUSY");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("places the order when the store is taking orders", async () => {
    readStoreStatus.mockResolvedValue(open());
    rpc.mockResolvedValue({
      data: { order_id: "o-1", order_status: "pending", cart_id: CART_ID, is_final: true },
      error: null,
    });

    const result = await submitCart({ cart_id: CART_ID } as never);

    expect(rpc).toHaveBeenCalledWith("submit_cart_to_order", expect.objectContaining({
      p_cart_id: CART_ID,
    }));
    expect(result.error).toBeNull();
  });

  it("passes on the database's own refusal (it checks again)", async () => {
    // FORCE_STORE_OPEN opened the website layer, but store_setting says closed.
    readStoreStatus.mockResolvedValue(open());
    rpc.mockResolvedValue({
      data: null,
      error: {
        message: "We're closed right now. We open at 8:00 AM.",
        hint: "STORE_CLOSED",
      },
    });

    const result = await submitCart({ cart_id: CART_ID } as never);

    expect(result).toEqual({
      data: null,
      error: "We're closed right now. We open at 8:00 AM.",
      code: "STORE_CLOSED",
    });
  });
});
