import { describe, it, expect, vi } from "vitest";
import {
  ACTIVE_KITCHEN_STATUSES,
  countActiveKitchenOrders,
} from "./kitchen-queue";

/** Records what was asked of the database and answers with `count`. */
function stubClient(count: number | null) {
  const calls: { statuses?: readonly string[]; before?: string } = {};
  const query: any = {
    in(_column: string, statuses: readonly string[]) {
      calls.statuses = statuses;
      return query;
    },
    lt(_column: string, value: string) {
      calls.before = value;
      return query;
    },
    then(resolve: (value: { count: number | null }) => unknown) {
      return Promise.resolve({ count }).then(resolve);
    },
  };
  const supabase = { from: () => ({ select: () => query }) };
  return { supabase: supabase as any, calls };
}

describe("countActiveKitchenOrders", () => {
  it("counts the whole live queue when no cut-off is given", async () => {
    const { supabase, calls } = stubClient(7);

    expect(await countActiveKitchenOrders(supabase)).toBe(7);
    expect(calls.statuses).toEqual(ACTIVE_KITCHEN_STATUSES);
    expect(calls.before).toBeUndefined();
  });

  it("counts only what is ahead of a given order", async () => {
    const { supabase, calls } = stubClient(2);

    await countActiveKitchenOrders(supabase, "2026-09-26T02:00:00Z");
    expect(calls.before).toBe("2026-09-26T02:00:00Z");
  });

  /**
   * An unpaid order is not in the kitchen. Counting one would lengthen the
   * wait quoted to everybody else for food nobody is cooking.
   */
  it("leaves unpaid orders out of the queue", () => {
    expect(ACTIVE_KITCHEN_STATUSES).not.toContain("awaiting_payment");
    expect(ACTIVE_KITCHEN_STATUSES).not.toContain("payment_failed");
  });

  it("reads a failed count as an empty kitchen rather than refusing to quote", async () => {
    const { supabase } = stubClient(null);
    expect(await countActiveKitchenOrders(supabase)).toBe(0);
  });
});
