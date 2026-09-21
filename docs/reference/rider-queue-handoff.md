# Handoff: put dispatched orders in the rider queue

**For:** backend developer. **From:** frontend. **Blocks:** the assigned-rider
card on the customer tracking screen (`/orders/[orderId]`).

## The problem

Nothing creates a `delivery` row. The rider queue (`getAssignedDeliveries`
in `lib/actions/delivery.ts`) lists `delivery` rows with no `rider_id`, and
`acceptDelivery` only *updates* an existing row. So when staff mark an order
"Out for delivery", `order.order_status` changes and nothing else happens —
no rider can ever accept it, and the customer never sees a rider.

## What to build

When a **delivery-type** order moves to `out_for_delivery`, make sure it has
a `delivery` row.

- Table: `delivery`
- Insert: `order_id` = the order, `delivery_status` = `'pending'`,
  `rider_id` = `NULL`
- Skip take-out and dine-in orders (`order.order_type` is free text — fold
  it with `trim().toLowerCase()` and compare to `'delivery'`)
- Look before inserting: if a row for that `order_id` already exists, do
  nothing. The KDS and the orders page both call `updateOrderStatus`, so a
  second dispatch must not queue the order twice.

## Where

`updateOrderStatus` in `lib/actions/orders.ts`, after the `order` update
succeeds. Add `order_type` to the lookup select (`"order_id, order_status,
order_type"`). Shape:

```ts
if (validatedNewStatus === "out_for_delivery" && isDeliveryOrder(order.order_type)) {
  const { data: existing } = await supabase
    .from("delivery").select("delivery_id").eq("order_id", order.order_id).maybeSingle();
  if (!existing) {
    const { error } = await supabase
      .from("delivery")
      .insert({ order_id: order.order_id, delivery_status: "pending", rider_id: null });
    if (error) return { data: null, error: `Order marked out for delivery, but it could not be added to the rider queue: ${error.message}` };
  }
}
```

A DB trigger on `order` (status → `out_for_delivery`) would also work and
covers the `/api/orders/[id]/status` route for free; either is fine.

## Also check (RLS)

- Staff / Manager can **insert** into `delivery`.
- Customers can **read** `rider` (`vehicle_make_model`,
  `vehicle_plate_number`) and `employee` (`name`, `profileImage_URL`) —
  the tracking screen reads them for the rider card. If blocked, the card
  shows "Your rider" with no details.

## Done when

1. Customer places a delivery order; staff move it to Out for delivery.
2. A rider sees it on `/deliver` and accepts it.
3. `/orders/<id>` shows the rider's name, vehicle and plate without a reload.
