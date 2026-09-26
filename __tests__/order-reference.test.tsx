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
    delivery_address: "21 Mabini St, Malate, Manila",
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
 * Issue #106: the same order read four different ways. The customer saw the
 * last four characters of the UUID, the kitchen and manage saw the *first*
 * four, and the rider's modal showed the `delivery_id` — a different UUID
 * entirely. Nobody could check they were talking about the same food.
 *
 * Everyone now gets the UUID's leading group of eight.
 */
describe("one order reference", () => {
  it("gives the kitchen and manage the same string as the customer", () => {
    expect(mapStaffOrder(staffRow()).orderNumber).toBe(
      formatOrderNumber(ORDER_ID),
    );
  });

  /**
   * Four hex characters is 65,536 possibilities, so a collision arrives
   * within a few hundred orders. These two both used to map to "7C9E".
   */
  it("keeps enough of the id that these two no longer collide", () => {
    const other = {
      ...staffRow(),
      order_id: "7c9e0000-7425-40de-944b-e07fc1f90ae7",
    };

    expect(mapStaffOrder(staffRow()).orderNumber).toBe("7c9e6679");
    expect(mapStaffOrder(other as StaffOrderRow).orderNumber).toBe("7c9e0000");
  });
});
