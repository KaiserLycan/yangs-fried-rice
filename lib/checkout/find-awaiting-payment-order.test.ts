import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { findAwaitingPaymentOrder } from "@/lib/checkout/find-awaiting-payment-order";

/**
 * Records the filters the query was built with, so the test can assert what
 * was asked for rather than only what came back.
 */
function mockOrderQuery(row: { order_id: string } | null) {
  const calls: Record<string, unknown[]> = {};
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "gte", "order", "limit"]) {
    builder[method] = vi.fn((...args: unknown[]) => {
      calls[method] = args;
      return builder;
    });
  }
  builder.maybeSingle = vi.fn(async () => ({ data: row }));

  (createClient as any).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cust-1" } } }),
    },
    from: vi.fn(() => builder),
  });

  return calls;
}

describe("findAwaitingPaymentOrder", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.useRealTimers());

  it("returns the order id of a recent unpaid order", async () => {
    mockOrderQuery({ order_id: "order-9" });
    await expect(findAwaitingPaymentOrder()).resolves.toBe("order-9");
  });

  it("returns null when there is no unpaid order", async () => {
    mockOrderQuery(null);
    await expect(findAwaitingPaymentOrder()).resolves.toBeNull();
  });

  it("returns null when nobody is signed in", async () => {
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(() => {
        throw new Error("must not query without a user");
      }),
    });
    await expect(findAwaitingPaymentOrder()).resolves.toBeNull();
  });

  it("asks only for this customer's orders, and only unpaid ones", async () => {
    const calls = mockOrderQuery({ order_id: "order-9" });
    await findAwaitingPaymentOrder();

    expect(calls.eq).toEqual(["customer_id", "cust-1"]);
    expect(calls.in?.[0]).toBe("order_status");
    // `pending` is the live kitchen state — pulling a customer back into a
    // receipt for food already being cooked would be the opposite of help.
    expect(calls.in?.[1]).toEqual(
      expect.arrayContaining(["awaiting_payment", "payment_failed"]),
    );
    expect(calls.in?.[1]).not.toContain("pending");
  });

  it("looks back one hour, not forever", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-26T12:00:00.000Z"));

    const calls = mockOrderQuery({ order_id: "order-9" });
    await findAwaitingPaymentOrder();

    expect(calls.gte).toEqual(["created_at", "2026-09-26T11:00:00.000Z"]);
  });
});
