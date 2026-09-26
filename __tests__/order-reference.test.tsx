import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { mapStaffOrder, type StaffOrderRow } from "@/lib/orders/map-staff-order";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { ProofOfDeliveryModal } from "@/components/deliver/proof-of-delivery-modal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/actions/delivery", () => ({
  markDelivered: vi.fn(),
}));

const ORDER_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const DELIVERY_ID = "1b2c3d4e-5555-6666-7777-888899990000";

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
 */
describe("one order reference", () => {
  it("gives the kitchen and manage the same string as the customer", () => {
    expect(mapStaffOrder(staffRow()).orderNumber).toBe(
      formatOrderNumber(ORDER_ID),
    );
  });

  it("no longer truncates, so two orders cannot share a reference", () => {
    const other = { ...staffRow(), order_id: "7c9e6679-0000-0000-0000-000000000000" };

    // Both used to map to "7C9E" — the first four characters.
    expect(mapStaffOrder(staffRow()).orderNumber).not.toBe(
      mapStaffOrder(other as StaffOrderRow).orderNumber,
    );
  });
});

describe("the rider's proof-of-delivery modal", () => {
  it("quotes the order, not the delivery's own id", () => {
    render(
      <ProofOfDeliveryModal
        isOpen
        onClose={() => {}}
        deliveryId={DELIVERY_ID}
        orderId={ORDER_ID}
        customerName="Liza Reyes"
      />,
    );

    expect(screen.getByText(`#${ORDER_ID}`)).toBeInTheDocument();
    expect(screen.queryByText(`#${DELIVERY_ID}`)).toBeNull();
  });

  /**
   * A delivery with no order row behind it has nothing else to identify it.
   * It falls back to its own id — but says which kind of reference that is,
   * rather than passing it off as the order's.
   */
  it("labels the fallback honestly when there is no order", () => {
    render(
      <ProofOfDeliveryModal
        isOpen
        onClose={() => {}}
        deliveryId={DELIVERY_ID}
        orderId={null}
        customerName="Liza Reyes"
      />,
    );

    expect(screen.getByText(`#${DELIVERY_ID}`)).toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();
  });
});
