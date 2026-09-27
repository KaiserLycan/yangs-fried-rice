import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * deleteMyAccount refuses while any order is still in progress (issue #115),
 * before touching anything, and refuses too when it cannot tell.
 *
 * Same chainable fake as cart.limits.test.ts: builder methods return the
 * builder, awaiting it resolves to `{ data, error, count }`, and writes are
 * recorded so a refusal can be shown to have written nothing.
 */

let orderCount: { count: number | null; error: unknown } = { count: 0, error: null };
let writes: { table: string; op: string }[] = [];
const deleteUser = vi.fn(async () => ({ error: null }));

function builder(table: string) {
  let counting = false;
  const b: Record<string, unknown> = {};
  b.select = (_cols: string, opts?: { count?: string }) => {
    if (opts?.count) counting = true;
    return b;
  };
  for (const m of ["eq", "not", "in"]) b[m] = () => b;
  for (const op of ["insert", "update", "delete"]) {
    b[op] = () => {
      writes.push({ table, op });
      return b;
    };
  }
  b.maybeSingle = async () => ({ data: null, error: null });
  b.then = (resolve: (v: unknown) => void) =>
    resolve(
      counting && table === "order"
        ? { data: null, ...orderCount }
        : { data: null, error: null },
    );
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "customer-1" } } }),
      signOut: vi.fn(async () => ({})),
    },
    from: (table: string) => builder(table),
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ auth: { admin: { deleteUser } } }),
}));
vi.mock("@/lib/storage/remove-stored-image", () => ({
  removeStoredImage: vi.fn(async () => {}),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const expireAbandonedOrders = vi.fn(async (_id: string) => [] as string[]);
vi.mock("@/lib/checkout/expire-abandoned-orders", () => ({
  expireAbandonedOrders: (id: string) => expireAbandonedOrders(id),
}));

import { deleteMyAccount } from "./profile";

beforeEach(() => {
  writes = [];
  deleteUser.mockClear();
  expireAbandonedOrders.mockClear();
  orderCount = { count: 0, error: null };
});

describe("deleteMyAccount", () => {
  it("refuses while an order is in progress, and writes nothing", async () => {
    orderCount = { count: 1, error: null };

    const result = await deleteMyAccount();

    expect(result).toEqual({
      data: null,
      error: "You have an order in progress. You can delete your account once it's done.",
    });
    expect(writes).toEqual([]);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("refuses when the orders can't be checked", async () => {
    orderCount = { count: null, error: { message: "boom" } };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteMyAccount();

    expect(result.error).toBe("We couldn't check your orders. Please try again.");
    expect(writes).toEqual([]);
    expect(deleteUser).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("cancels stale unpaid orders before counting (issue #115)", async () => {
    await deleteMyAccount();
    expect(expireAbandonedOrders).toHaveBeenCalledWith("customer-1");
  });

  it("still checks the count when expiring fails", async () => {
    expireAbandonedOrders.mockRejectedValueOnce(new Error("boom"));
    orderCount = { count: 1, error: null };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteMyAccount();

    expect(result.error).toMatch(/order in progress/);
    expect(deleteUser).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("deletes the account when every order is finished", async () => {
    const result = await deleteMyAccount();

    expect(result.error).toBeNull();
    expect(deleteUser).toHaveBeenCalledWith("customer-1");
  });
});
