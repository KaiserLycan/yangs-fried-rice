import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The order-size rules in the cart actions (issue #115): 30 items per order
 * (MAX_ITEMS_PER_ORDER) and 20 of one dish (MAX_QUANTITY), checked while the
 * cart is built rather than only at checkout.
 *
 * The Supabase client is a small chainable fake: every builder method
 * returns the builder, `.single()` / `.maybeSingle()` resolve to the table's
 * `one` row, and awaiting the builder resolves to its `many` rows. Writes are
 * recorded so a test can assert nothing was written.
 */

type TableData = { one?: unknown; many?: unknown[] };
let tables: Record<string, TableData> = {};
let writes: { table: string; op: string }[] = [];
let inserted: { table: string; rows: unknown }[] = [];

function builder(table: string) {
  const b: Record<string, unknown> = {};
  const chain = () => b;
  for (const m of ["select", "eq", "in", "order", "limit"]) b[m] = chain;
  for (const op of ["insert", "update", "delete"]) {
    b[op] = (rows?: unknown) => {
      writes.push({ table, op });
      if (op === "insert") inserted.push({ table, rows });
      return b;
    };
  }
  b.single = async () => ({ data: tables[table]?.one ?? null, error: null });
  b.maybeSingle = b.single;
  b.then = (resolve: (v: unknown) => void) =>
    resolve({ data: tables[table]?.many ?? [], error: null });
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "customer-1" } } }) },
    from: (table: string) => builder(table),
    rpc: vi.fn(),
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/store/read-store-status", () => ({ readStoreStatus: vi.fn() }));

import { addCartItem, reorderPastOrder, updateCartItem } from "./cart";

const PRODUCT_ID = "0b6f3f7e-8c2e-4c1a-9f0e-3b1a2c4d5e6f";

/** A cart line — of another dish unless one is named. */
function line(id: string, quantity: number, productId = "other-dish") {
  return {
    cart_item_id: id,
    product_id: productId,
    quantity,
    special_instructions: null,
    cart_item_add_on: [],
  };
}

beforeEach(() => {
  writes = [];
  inserted = [];
  tables = {
    customer: { one: { customer_id: "customer-1", is_account_disabled: false } },
    cart: { one: { cart_id: "cart-1", is_final: false } },
    product: {
      one: {
        product_id: PRODUCT_ID,
        product_name: "Yang Chow",
        product_price: 150,
        is_available: true,
      },
    },
    cart_item: { many: [] },
  };
});

describe("addCartItem", () => {
  it("refuses an add that takes the cart past 30 items, and writes nothing", async () => {
    tables.cart_item.many = [line("L1", 20), line("L2", 8)]; // 28

    const result = await addCartItem({ product_id: PRODUCT_ID, quantity: 3 });

    expect(result).toEqual({
      data: null,
      error: "That's a big order! Please contact us for a bulk order or catering.",
      code: "ORDER_TOO_LARGE",
    });
    expect(writes.filter((w) => w.table === "cart_item")).toEqual([]);
  });

  it("allows an add that fills the cart exactly to 30", async () => {
    tables.cart_item.many = [line("L1", 20), line("L2", 7)]; // 27
    tables.cart_item.one = { cart_item_id: "new", quantity: 3 };

    const result = await addCartItem({
      product_id: PRODUCT_ID,
      quantity: 3,
      special_instructions: "extra spicy", // a note means a new line, no merge
    });

    expect(result.error).toBeNull();
  });

  it("refuses a merge past 20 of one dish instead of clamping silently", async () => {
    tables.cart_item.many = [line("L1", 18, PRODUCT_ID)];

    const result = await addCartItem({ product_id: PRODUCT_ID, quantity: 3 });

    expect(result).toEqual({
      data: null,
      error: "You can only order up to 20 of each dish (Yang Chow).",
      code: "ITEM_LIMIT_EXCEEDED",
    });
    expect(writes.filter((w) => w.table === "cart_item")).toEqual([]);
  });

  // Issue #115 follow-up: 13 plain + 10 with a note went through as two lines.
  it("counts the dish across lines: 13 already, 10 more with a note is refused", async () => {
    tables.cart_item.many = [line("L1", 13, PRODUCT_ID)];

    const result = await addCartItem({
      product_id: PRODUCT_ID,
      quantity: 10,
      special_instructions: "less ice",
    });

    expect(result).toEqual({
      data: null,
      error: "You can only order up to 20 of each dish (Yang Chow).",
      code: "ITEM_LIMIT_EXCEEDED",
    });
    expect(writes.filter((w) => w.table === "cart_item")).toEqual([]);
  });

  it("allows the dish up to exactly 20 across lines", async () => {
    tables.cart_item.many = [line("L1", 13, PRODUCT_ID)];
    tables.cart_item.one = { cart_item_id: "new", quantity: 7 };

    const result = await addCartItem({
      product_id: PRODUCT_ID,
      quantity: 7,
      special_instructions: "less ice",
    });

    expect(result.error).toBeNull();
  });

  it("rejects more than 20 in one add at validation", async () => {
    const result = await addCartItem({ product_id: PRODUCT_ID, quantity: 21 });
    expect(result.error).toMatch(/cannot exceed 20/);
  });
});

describe("updateCartItem", () => {
  beforeEach(() => {
    tables.cart_item.one = {
      cart_item_id: "L1",
      cart_id: "cart-1",
      product_id: PRODUCT_ID,
      quantity: 5,
      special_instructions: null,
      cart: { cart_id: "cart-1", customer_id: "customer-1", is_final: false },
      product: { product_name: "Yang Chow", product_price: 150 },
    };
    // L1 at 5 plus 25 elsewhere = 30, already full.
    tables.cart_item.many = [line("L1", 5), line("L2", 20), line("L3", 5)];
  });

  it("refuses raising a line when the cart is already at 30", async () => {
    const result = await updateCartItem("L1", { quantity: 6 });

    expect(result).toEqual({
      data: null,
      error: "That's a big order! Please contact us for a bulk order or catering.",
      code: "ORDER_TOO_LARGE",
    });
    expect(writes.filter((w) => w.table === "cart_item")).toEqual([]);
  });

  it("refuses raising a line past 20 of the dish across its lines", async () => {
    // L1 (5) and L2 (13) are the same dish; the cart holds 18.
    tables.cart_item.many = [line("L1", 5, PRODUCT_ID), line("L2", 13, PRODUCT_ID)];

    const result = await updateCartItem("L1", { quantity: 8 });

    expect(result).toEqual({
      data: null,
      error: "You can only order up to 20 of each dish (Yang Chow).",
      code: "ITEM_LIMIT_EXCEEDED",
    });
    expect(writes.filter((w) => w.table === "cart_item")).toEqual([]);
  });

  it("always allows lowering a line", async () => {
    const result = await updateCartItem("L1", { quantity: 4 });

    expect(result.error).toBeNull();
    expect(writes).toContainEqual({ table: "cart_item", op: "update" });
  });
});

describe("reorderPastOrder (issue #115)", () => {
  const RICE = "addon-rice";

  function orderedLine(quantity: number, note: string | null = null) {
    return {
      quantity,
      special_instructions: note,
      product: {
        product_id: PRODUCT_ID,
        product_name: "Yang Chow",
        is_available: true,
        archived_at: null,
      },
      order_item_add_on: [],
    };
  }

  beforeEach(() => {
    tables.order = { one: { order_id: "order-1" } };
    tables.cart_item.many = [];
    tables.order_add_on = { many: [{ addon_id: RICE }] };
    tables.add_on = { many: [{ addon_id: RICE, product_id: null }] };
  });

  it("puts back the same lines, quantities and notes, and the order-wide add-ons", async () => {
    tables.order_item = { many: [orderedLine(3), orderedLine(2, "extra spicy")] };

    const result = await reorderPastOrder("order-1");

    expect(result.error).toBeNull();
    const lines = inserted.find((i) => i.table === "cart_item")?.rows as {
      quantity: number;
      special_instructions: string | null;
    }[];
    expect(lines.map((l) => [l.quantity, l.special_instructions])).toEqual([
      [3, null],
      [2, "extra spicy"],
    ]);
    expect(inserted.find((i) => i.table === "cart_add_on")?.rows).toEqual([
      { cart_id: "cart-1", addon_id: RICE },
    ]);
  });

  it("refuses, rather than shrinking the order, when a dish would pass 20", async () => {
    // An old order of 23 across two lines.
    tables.order_item = { many: [orderedLine(13), orderedLine(10, "less ice")] };

    const result = await reorderPastOrder("order-1");

    expect(result).toEqual({
      data: null,
      error: "You can only order up to 20 of each dish (Yang Chow).",
      code: "ITEM_LIMIT_EXCEEDED",
    });
    expect(writes.filter((w) => w.table === "cart_item")).toEqual([]);
  });

  it("counts what is already in the cart", async () => {
    tables.cart_item.many = [line("L1", 15, PRODUCT_ID)];
    tables.order_item = { many: [orderedLine(6)] };

    const result = await reorderPastOrder("order-1");

    expect(result.error).toBe("You can only order up to 20 of each dish (Yang Chow).");
  });

  it("refuses when the order would pass 30 items", async () => {
    tables.cart_item.many = [line("L1", 20), line("L2", 8)];
    tables.order_item = { many: [orderedLine(3)] };

    const result = await reorderPastOrder("order-1");

    expect(result.error).toBe(
      "That's a big order! Please contact us for a bulk order or catering.",
    );
  });
});
