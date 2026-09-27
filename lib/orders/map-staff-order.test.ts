import { describe, expect, it } from "vitest";
import { mapStaffOrder, type StaffOrderRow } from "./map-staff-order";

function row(over: Partial<StaffOrderRow> = {}): StaffOrderRow {
  return {
    order_id: "3820abcd-0000-0000-0000-000000000000",
    created_at: "2026-09-26T01:14:00Z",
    order_status: "preparing",
    order_type: "delivery",
    delivery_fee: 58.9,
    delivery_address: "21 Mabini St., Malate, Manila 1004",
    special_instructions: null,
    customer: { name: "Liza Reyes", email: null, phone_number: "+639172200000" },
    order_item: [],
    ...over,
  };
}

describe("mapStaffOrder — special instructions (P30)", () => {
  const twoLines = row({
    special_instructions: "Leave at the guard house",
    order_item: [
      {
        quantity: 1,
        subtotal: 125,
        special_instructions: "extra funky",
        product_name: "Chicken Feet in Black Bean",
        product: null,
        order_item_add_on: [{ add_on: { name: "Extra sauce", price: 10 } }],
      },
      {
        quantity: 1,
        subtotal: 80,
        special_instructions: "extra almondy",
        product_name: "Almond Jelly",
        product: null,
        order_item_add_on: [],
      },
    ],
  });

  it("keeps each line's instructions on that line, apart from its add-ons", () => {
    const { items } = mapStaffOrder(twoLines);
    expect(items[0]).toMatchObject({
      addons: "Extra sauce",
      instructions: "extra funky",
    });
    expect(items[1]).toMatchObject({ instructions: "extra almondy" });
    expect(items[1].addons).toBeUndefined();
  });

  it("uses the order's own note as the order-level instructions, not the first line's", () => {
    expect(mapStaffOrder(twoLines).orderInfo.specialInstructions).toBe(
      "Leave at the guard house",
    );
    expect(
      mapStaffOrder({ ...twoLines, special_instructions: null }).orderInfo
        .specialInstructions,
    ).toBe("");
  });
});

describe("mapStaffOrder pendingAt (issue #115)", () => {
  it("carries pending_at while the order is still pending", () => {
    const mapped = mapStaffOrder(
      row({ order_status: "pending", pending_at: "2026-09-28T04:00:00.000Z" }),
    );
    expect(mapped.pendingAt).toBe("2026-09-28T04:00:00.000Z");
  });

  it("falls back to created_at for a pending order from before pending_at", () => {
    const mapped = mapStaffOrder(
      row({ order_status: "pending", pending_at: null, created_at: "2026-09-28T03:00:00.000Z" }),
    );
    expect(mapped.pendingAt).toBe("2026-09-28T03:00:00.000Z");
  });

  it("has none once staff accepted it, even in the QUEUE column", () => {
    expect(
      mapStaffOrder(row({ order_status: "received", pending_at: "2026-09-28T04:00:00.000Z" }))
        .pendingAt,
    ).toBeNull();
    expect(
      mapStaffOrder(row({ order_status: "preparing", pending_at: "2026-09-28T04:00:00.000Z" }))
        .pendingAt,
    ).toBeNull();
  });
});

describe("mapStaffOrder — Senior Citizen / PWD discount (#116)", () => {
  const line = {
    quantity: 1,
    subtotal: 112,
    special_instructions: null,
    product_name: "Yang Chow",
    product: null,
    order_item_add_on: [],
  };

  it("totals a discounted order at what is owed, not at menu prices", () => {
    const mapped = mapStaffOrder(
      row({
        order_type: "take_out",
        delivery_fee: 0,
        order_item: [line],
        transaction: [
          {
            subtotal: 100,
            discount_amount: 20,
            discount_type: "senior_citizen",
            discount_id_number: "OSCA-123",
            name_on_id: "Liza Reyes",
            discount_id_photo_path: "x/y.jpg",
          },
        ],
      }),
    );
    expect(mapped.total).toBe(80);
    expect(mapped.seniorPwd).toEqual({
      type: "senior_citizen",
      idNumber: "OSCA-123",
      nameOnId: "Liza Reyes",
      discount: 20,
      hasPhoto: true,
    });
  });

  it("leaves an ordinary order at menu prices with no badge", () => {
    const mapped = mapStaffOrder(
      row({
        order_type: "take_out",
        delivery_fee: 0,
        order_item: [line],
        transaction: [{ subtotal: 112, discount_amount: 0, discount_type: null }],
      }),
    );
    expect(mapped.total).toBe(112);
    expect(mapped.seniorPwd).toBeUndefined();
  });
});
