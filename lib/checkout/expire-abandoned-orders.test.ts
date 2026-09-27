import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  ABANDONED_REASON,
  PAYMENT_WINDOW_MS,
  expireAbandonedOrders,
} from "@/lib/checkout/expire-abandoned-orders";

/**
 * A stand-in for the two tables this touches, recording every filter so a
 * test can assert what was *asked for* — which is the whole safety story
 * here, since this runs as the service role and RLS is not a backstop.
 */
function mockAdmin({
  candidates = [] as { order_id: string }[],
  paid = [] as { order_id: string }[],
  cancelled = null as { order_id: string }[] | null,
  writeError = null as unknown,
}) {
  const seen: Record<string, any> = { order: {}, transaction: {}, update: null };

  function builder(table: string, resolveTo: any) {
    const b: Record<string, any> = {};
    for (const method of ["select", "eq", "in", "lt", "update"]) {
      b[method] = vi.fn((...args: unknown[]) => {
        if (method === "update") seen.update = args[0];
        else {
          seen[table][method] = seen[table][method] ?? [];
          seen[table][method].push(args);
        }
        return b;
      });
    }
    b.then = (resolve: any) => Promise.resolve(resolveTo).then(resolve);
    return b;
  }

  let updating = false;
  (createAdminClient as any).mockReturnValue({
    from: (table: string) => {
      if (table === "transaction") {
        return builder("transaction", { data: paid, error: null });
      }
      // The order table is read first, then written.
      const result = updating
        ? { data: cancelled, error: writeError }
        : { data: candidates, error: null };
      const b = builder("order", result);
      const origUpdate = b.update;
      b.update = (...args: unknown[]) => {
        updating = true;
        seen.update = args[0];
        // Rebuild so the write resolves to the write result.
        const w = builder("order", { data: cancelled, error: writeError });
        return w;
      };
      void origUpdate;
      return b;
    },
  });

  return seen;
}

const NOW = new Date("2026-09-26T12:00:00.000Z");

beforeEach(() => vi.clearAllMocks());

/**
 * Issue #106. `submitCart` creates the order before PayMongo is contacted,
 * so an abandoned wallet payment leaves a row at `awaiting_payment` that
 * goes on offering "Complete payment" long after the source expired.
 */
describe("expireAbandonedOrders", () => {
  it("gives a customer 30 minutes to pay (issue #115)", () => {
    expect(PAYMENT_WINDOW_MS).toBe(30 * 60 * 1000);
  });

  it("writes the same reason as the expire_abandoned_orders() sweep", () => {
    expect(ABANDONED_REASON).toBe(
      "Payment wasn't completed, so this order was cancelled. Nothing was charged.",
    );
  });

  it("cancels an abandoned order, saying why and when", async () => {
    const seen = mockAdmin({
      candidates: [{ order_id: "o-1" }],
      cancelled: [{ order_id: "o-1" }],
    });

    expect(await expireAbandonedOrders("cust-1", NOW)).toEqual(["o-1"]);
    expect(seen.update).toEqual({
      order_status: "cancelled",
      cancelled_at: NOW.toISOString(),
      cancellation_reason: ABANDONED_REASON,
    });
  });

  it("looks only at this customer, only unpaid, only past the window", async () => {
    const seen = mockAdmin({ candidates: [] });
    await expireAbandonedOrders("cust-1", NOW);

    expect(seen.order.eq).toContainEqual(["customer_id", "cust-1"]);
    expect(seen.order.in).toContainEqual([
      "order_status",
      ["awaiting_payment", "payment_failed"],
    ]);
    expect(seen.order.lt).toContainEqual([
      "created_at",
      new Date(NOW.getTime() - PAYMENT_WINDOW_MS).toISOString(),
    ]);
  });

  /**
   * The case that matters most. A webhook that arrives late leaves an order
   * whose money *did* change hands sitting at `awaiting_payment`. Telling a
   * customer who paid that their order is gone is far worse than an orphan
   * row, so the transaction decides — not the order's own status.
   */
  it("never cancels an order whose payment actually landed", async () => {
    const seen = mockAdmin({
      candidates: [{ order_id: "paid-1" }],
      paid: [{ order_id: "paid-1" }],
    });

    expect(await expireAbandonedOrders("cust-1", NOW)).toEqual([]);
    expect(seen.update).toBeNull();
  });

  it("still cancels the unpaid ones alongside a paid one", async () => {
    const seen = mockAdmin({
      candidates: [{ order_id: "paid-1" }, { order_id: "dead-1" }],
      paid: [{ order_id: "paid-1" }],
      cancelled: [{ order_id: "dead-1" }],
    });

    expect(await expireAbandonedOrders("cust-1", NOW)).toEqual(["dead-1"]);
    expect(seen.update).not.toBeNull();
  });

  it("writes nothing when there is nothing to expire", async () => {
    const seen = mockAdmin({ candidates: [] });
    expect(await expireAbandonedOrders("cust-1", NOW)).toEqual([]);
    expect(seen.update).toBeNull();
  });

  it("reports nothing cancelled when the write fails", async () => {
    mockAdmin({
      candidates: [{ order_id: "o-1" }],
      cancelled: null,
      writeError: { message: "nope" },
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await expireAbandonedOrders("cust-1", NOW)).toEqual([]);
    spy.mockRestore();
  });
});
