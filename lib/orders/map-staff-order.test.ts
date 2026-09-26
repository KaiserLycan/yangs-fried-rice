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
