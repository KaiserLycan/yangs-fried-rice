import { describe, it, expect } from "vitest";
import { mapStaffOrder, type StaffOrderRow } from "@/lib/orders/map-staff-order";
import { formatOrderNumber } from "@/lib/orders/order-number";

const ORDER_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

function staffRow(): StaffOrderRow {
  return {
    order_id: ORDER_ID,
    created_at: "2026-09-26T02:00:00Z",
    order_status: "pending",
    order_type: "delivery",
    delivery_fee: 50,
    customer: { name: "Liza Reyes", email: "liza@example.com" },
    order_item: [
      {
        quantity: 2,
        subtotal: 240,
        special_instructions: null,
        product_name: "Yang's Special",
        unit_price: 120,
        product: { product_name: "Yang's Special", product_price: 120 },
      },
    ],
  } as StaffOrderRow;
}

/**
 * Issue #106: the same order read four different ways, so nobody could check
 * they were talking about the same food. Everyone now gets one reference —
 * since the UI/UX review, the readable `order_number` (#1042), with the
 * UUID's leading group only as a fallback for a row read without it.
 */
describe("one order reference", () => {
  it("gives the kitchen and manage the same string as the customer", () => {
    const row = { ...staffRow(), order_number: 1042 };
    expect(mapStaffOrder(row).orderNumber).toBe(formatOrderNumber(1042, ORDER_ID));
    expect(mapStaffOrder(row).orderNumber).toBe("1042");
  });

  it("falls back to the id's leading group when the number wasn't selected", () => {
    const other = { ...staffRow(), order_id: "7c9e0000-7425-40de-944b-e07fc1f90ae7" };
    expect(mapStaffOrder(staffRow()).orderNumber).toBe("7c9e6679");
    expect(mapStaffOrder(other as StaffOrderRow).orderNumber).toBe("7c9e0000");
  });
});
