"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeOrderTotal } from "@/lib/orders/order-total";
import {
  RELEASED_DELIVERY_STATUS,
  releaseRefusalReason,
} from "@/lib/orders/delivery-assignment";
import { revalidatePath } from "next/cache";

/**
 * Storage bucket for proof-of-delivery photos. Must be created manually
 * in the Supabase dashboard before markDelivered will work — see the
 * setup notes accompanying this file. Not something this code can create
 * for itself; Storage buckets are a dashboard/infra step, not a schema
 * migration.
 */
const PROOF_BUCKET = "proof-of-delivery";
const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];

type DeliverySummary = {
  deliveryId: string;
  orderId: string | null;
  deliveryStatus: string | null;
  estimatedTime: string | null;
  createdAt: string;
};

type DeliveryDetail = {
  deliveryId: string;
  deliveryStatus: string | null;
  estimatedTime: string | null;
  proofOfDelivery: string | null;
  createdAt: string | null;
  customer: { name: string; address: string | null; phone: string | null } | null;
  payment: {
    method: string;
    status?: string | null;
    total: number;
    deliveryFee: number;
  } | null;
  items: { productName: string; quantity: number }[];
};

function getProofFile(formData: FormData): File | null {
  const candidateKeys = ["proof", "proofPhoto"];

  for (const key of candidateKeys) {
    const value = formData.get(key);
    if (value instanceof File && value.size > 0) {
      return value;
    }
  }

  return null;
}

/**
 * Resolves the current session to a rider row, or null if the caller
 * isn't signed in as a rider. Every action below starts from this —
 * a rider should only ever see and act on deliveries assigned to them,
 * never another rider's.
 */
async function getCurrentRider(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rider } = await supabase
    .from("rider")
    .select("rider_id, employee_id")
    .eq("employee_id", user.id)
    .single();

  return rider ?? null;
}

/**
 * Order5: deliveries dispatched to the signed-in rider.
 *
 * "Receive incoming delivery requests" is read here as viewing what's
 * already been dispatched (rider_id set) rather than an accept/decline
 * flow — the ERD's Employee-to-Delivery relationship is literally
 * "dispatches," implying staff assign the rider elsewhere, and this
 * action's job is just to show the rider their queue.
 *
 * Excludes already-delivered ones so the list reads as an active queue,
 * not a full history — delivery history for riders isn't part of this
 * issue's acceptance criteria.
 */
export async function getAssignedDeliveries(): Promise<{
  deliveries: DeliverySummary[];
  error: string | null;
}> {
  console.log("getAssignedDeliveries called");
  const supabase = createClient();
  const rider = await getCurrentRider(supabase);
  if (!rider) {
    return {
      deliveries: [],
      error: "You need to be signed in as a rider to see this.",
    };
  }

  // Deliveries assigned to this rider, plus the ones nobody has taken.
  //
  // Two filtered reads rather than one `.or("rider_id.eq." + id + ",…")`.
  // That string is a PostgREST filter expression, so building it by
  // concatenation is the same class of mistake as building SQL by
  // concatenation; `.eq`/`.is` send values the client encodes, which nothing
  // can break out of. `__tests__/security/injection.test.ts` fails the build
  // if a filter string with interpolation reappears anywhere.
  const SELECT =
    "delivery_id, order_id, delivery_status, estimated_time, order:order_id(created_at)";

  const [assigned, unassigned] = await Promise.all([
    supabase.from("delivery").select(SELECT).eq("rider_id", rider.rider_id),
    supabase.from("delivery").select(SELECT).is("rider_id", null),
  ]);

  if (assigned.error || unassigned.error) {
    return { deliveries: [], error: "Could not load your deliveries." };
  }

  // Soonest estimate first, with un-estimated deliveries last — what the
  // single query's `order(..., { nullsFirst: false })` used to do.
  const data = [...(assigned.data ?? []), ...(unassigned.data ?? [])].sort(
    (a: any, b: any) => {
      if (!a.estimated_time && !b.estimated_time) return 0;
      if (!a.estimated_time) return 1;
      if (!b.estimated_time) return -1;
      return (
        new Date(a.estimated_time).getTime() - new Date(b.estimated_time).getTime()
      );
    },
  );

  return {
    deliveries: data.map((d: any) => ({
      deliveryId: d.delivery_id,
      orderId: d.order_id,
      deliveryStatus: d.delivery_status,
      estimatedTime: d.estimated_time,
      createdAt: d.order?.created_at || new Date().toISOString(),
    })),
    error: null,
  };
}

/**
 * Order6: full delivery detail — customer name, address, and order
 * contents — scoped to the signed-in rider's own assignment.
 *
 * A rider requesting a delivery_id that isn't theirs gets the same
 * "not found" as one that doesn't exist at all, rather than a
 * distinguishable permission-denied response that would confirm the id
 * is real. Customer name/address is PII; this boundary matters.
 */
export async function getDeliveryDetailsBatch(deliveryIds: string[]) {
  console.log("getDeliveryDetailsBatch called with IDs:", deliveryIds);
  const supabase = createClient();
  const rider = await getCurrentRider(supabase);
  if (!rider) return { deliveries: [], error: "Unauthorized" };

  if (!deliveryIds.length) return { deliveries: [], error: null };

  const { data: deliveries, error } = await supabase
    .from("delivery")
    .select(
      `
      delivery_id,
      order_id,
      delivery_status,
      estimated_time,
      proof_of_delivery,
      order:order_id (
        created_at,
        delivery_address,
        delivery_fee,
        customer:customer_id (
          name,
          phone_number
        )
      )
    `
    )
    .in("delivery_id", deliveryIds);

  console.log("Query returned deliveries length:", deliveries?.length, "error:", error?.message);

  if (error || !deliveries) {
    return { deliveries: [], error: error?.message || "Failed to fetch details" };
  }

  // Fetch transactions and items in bulk
  const orderIds = deliveries.map(d => d.order_id).filter(Boolean);
  
  let transactions: any[] = [];
  let orderItems: any[] = [];
  let orderAddOns: any[] = [];

  if (orderIds.length > 0) {
    const { data: tData } = await supabase
      .from("transaction")
      .select("order_id, payment_method, payment_status")
      .in("order_id", orderIds);
    if (tData) transactions = tData;

    const { data: iData } = await supabase
      .from("order_item")
      .select("order_id, quantity, subtotal, product:product_id (product_name)")
      .in("order_id", orderIds);
    if (iData) orderItems = iData;

    const { data: aData } = await supabase
      .from("order_add_on")
      .select("order_id, price")
      .in("order_id", orderIds);
    if (aData) orderAddOns = aData;
  }

  const mappedDeliveries = deliveries.map(delivery => {
    const orderRow = delivery.order as any;
    const createdAt = orderRow?.created_at || new Date().toISOString();
    
    let customer = null;
    if (orderRow?.customer) {
      customer = {
        name: orderRow.customer.name,
        phone: orderRow.customer.phone_number || "",
        email: "",
        address: orderRow.delivery_address || "",
      };
    } else if (orderRow) {
      customer = {
        name: "Walk-in Customer",
        phone: "",
        email: "",
        address: orderRow.delivery_address || "",
      };
    }

    const transactionRow = transactions?.find(t => t.order_id === delivery.order_id);
    // Full order value (items + add-ons + delivery fee), not total_paid —
    // that stays 0 for cash orders until the money is collected.
    const lines = orderItems?.filter(i => i.order_id === delivery.order_id) ?? [];
    const payment = {
      method: transactionRow?.payment_method ?? "cash_on_delivery",
      status: transactionRow?.payment_status ?? null,
      total: computeOrderTotal({
        itemSubtotals: lines.map((line) => line.subtotal),
        orderAddOnPrices: orderAddOns
          .filter((row) => row.order_id === delivery.order_id)
          .map((row) => row.price),
        deliveryFee: orderRow?.delivery_fee,
      }),
      deliveryFee: Number(orderRow?.delivery_fee) || 0,
    };

    const items = lines.map((item) => ({
      productName: item.product?.product_name ?? "Unknown item",
      quantity: item.quantity,
    }));

    return {
      deliveryId: delivery.delivery_id,
      deliveryStatus: delivery.delivery_status,
      estimatedTime: delivery.estimated_time,
      proofOfDelivery: delivery.proof_of_delivery,
      createdAt,
      customer,
      payment,
      items,
    };
  });

  return { deliveries: mappedDeliveries, error: null };
}

export async function getDeliveryDetail(deliveryId: string): Promise<{
  delivery: DeliveryDetail | null;
  error: string | null;
}> {
  const supabase = createClient();
  const rider = await getCurrentRider(supabase);
  if (!rider) {
    return {
      delivery: null,
      error: "You need to be signed in as a rider to see this.",
    };
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from("delivery")
    .select(
      "delivery_id, order_id, delivery_status, estimated_time, proof_of_delivery, rider_id"
    )
    .eq("delivery_id", deliveryId)
    .single();

// Allow the order to load if it belongs to this rider OR if it is unassigned
  if (deliveryError || !delivery || (delivery.rider_id !== null && delivery.rider_id !== rider.rider_id)) {
    return { delivery: null, error: "Delivery not found." };
  }

  let customer: { name: string; address: string | null; phone: string | null } | null = null;
  let payment: DeliveryDetail["payment"] = null;
  let items: { productName: string; quantity: number }[] = [];
  let createdAt: string | null = null;

  if (delivery.order_id) {
    const { data: order } = await supabase
      .from("order")
      .select("customer_id, delivery_address, created_at, delivery_fee")
      .eq("order_id", delivery.order_id)
      .single();

    if (order?.created_at) {
      createdAt = order.created_at;
    }

    if (order?.customer_id) {
      const { data: customerRow } = await supabase
        .from("customer")
        .select("name, phone_number")
        .eq("customer_id", order.customer_id)
        .single();

      if (customerRow) {
        customer = {
          name: customerRow.name,
          address: order.delivery_address ?? null,
          phone: customerRow.phone_number ?? null,
        };
      }
    }

    const { data: transactionRow } = await supabase
      .from("transaction")
      .select("payment_method, payment_status")
      .eq("order_id", delivery.order_id)
      .limit(1)
      .maybeSingle();

    const { data: orderItems } = await supabase
      .from("order_item")
      .select("quantity, subtotal, product:product_id (product_name)")
      .eq("order_id", delivery.order_id);

    const { data: orderAddOns } = await supabase
      .from("order_add_on")
      .select("price")
      .eq("order_id", delivery.order_id);

    items = (orderItems ?? []).map((item) => ({
      productName: item.product?.product_name ?? "Unknown item",
      quantity: item.quantity,
    }));

    // What the rider has to collect / hand over: items + add-ons + delivery
    // fee. NOT transaction.total_paid, which is 0 for a cash order until the
    // money is actually collected — that is what showed riders a ₱0 total.
    payment = {
      method: transactionRow?.payment_method ?? "cash_on_delivery",
      status: transactionRow?.payment_status ?? null,
      total: computeOrderTotal({
        itemSubtotals: (orderItems ?? []).map((item) => item.subtotal),
        orderAddOnPrices: (orderAddOns ?? []).map((row) => row.price),
        deliveryFee: order?.delivery_fee,
      }),
      deliveryFee: order?.delivery_fee ?? 0,
    };
  }

  return {
    delivery: {
      deliveryId: delivery.delivery_id,
      deliveryStatus: delivery.delivery_status,
      estimatedTime: delivery.estimated_time,
      proofOfDelivery: delivery.proof_of_delivery,
      createdAt,
      customer,
      payment,
      items,
    },
    error: null,
  };
}

/**
 * Order7: mark a delivery as delivered, with a required proof-of-delivery
 * photo. Uploads to the "proof-of-delivery" Storage bucket and stores the
 * resulting public URL on delivery.proof_of_delivery.
 *
 * Deliberately does NOT touch order.order_status — that field is shared
 * with the kitchen/order-management flow (a different issue), and this
 * action only owns delivery-specific fields.
 *
 * Takes FormData (not a plain object) because it carries a File — Next.js
 * Server Actions support this directly when called from a client
 * <form action={...}> or via new FormData() passed to the action manually.
 */
export async function markDelivered(
  deliveryId: string,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const rider = await getCurrentRider(supabase);
  if (!rider) {
    return {
      success: false,
      error: "You need to be signed in as a rider to do that.",
    };
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from("delivery")
    .select("delivery_id, rider_id, delivery_status, order_id")
    .eq("delivery_id", deliveryId)
    .single();

  if (deliveryError || !delivery || delivery.rider_id !== rider.rider_id) {
    return { success: false, error: "Delivery not found." };
  }
  if (delivery.delivery_status === "delivered") {
    return {
      success: false,
      error: "This delivery is already marked delivered.",
    };
  }

  // A cash-on-delivery run is only finished when the rider actually has the
  // money. The modal disables "Complete delivery" until the box is ticked,
  // but that is a convenience, not the rule: this action is callable
  // directly, and it escalates to the service role further down, so RLS is
  // no backstop. Until now `isCashCollected` was posted by the modal and then
  // dropped on the floor here, which made the tick decorative (issue #106).
  //
  // Read with the service role: riders have no select grant on `transaction`,
  // and a filtered-to-zero-rows read would look exactly like "not a cash
  // order" and wave the delivery through.
  const admin = createAdminClient();
  const isCashCollected = formData.get("isCashCollected") === "true";

  const [{ data: paymentRows, error: paymentReadError }, { data: orderRow }] =
    await Promise.all([
      admin
        .from("transaction")
        .select("transaction_id, payment_method, payment_status, subtotal")
        .eq("order_id", delivery.order_id ?? ""),
      admin
        .from("order")
        .select("delivery_fee")
        .eq("order_id", delivery.order_id ?? "")
        .maybeSingle(),
    ]);

  if (paymentReadError) {
    return {
      success: false,
      error: "Couldn't check this order's payment. Please try again.",
    };
  }

  const orderDeliveryFee = orderRow?.delivery_fee ?? 0;

  // The one row that still owes money in cash. An order already settled
  // online has nothing to collect, so the tick is neither shown nor required.
  const cashDue = (paymentRows ?? []).find(
    (row) =>
      row.payment_method === "cash_on_delivery" && row.payment_status !== "paid",
  );

  if (cashDue && !isCashCollected) {
    return {
      success: false,
      error: "Confirm the cash payment before completing this delivery.",
    };
  }

  const proofFile = getProofFile(formData);
  if (!proofFile) {
    return { success: false, error: "A proof-of-delivery photo is required." };
  }
  if (!ALLOWED_PROOF_TYPES.includes(proofFile.type)) {
    return {
      success: false,
      error: "Proof of delivery must be a JPEG, PNG, or WebP image.",
    };
  }
  if (proofFile.size > MAX_PROOF_SIZE_BYTES) {
    return {
      success: false,
      error: "Proof of delivery photo must be under 5MB.",
    };
  }

  const fileExt = proofFile.name.split(".").pop() ?? "jpg";
  const filePath = `${deliveryId}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(filePath, proofFile, { contentType: proofFile.type });

  if (uploadError) {
    return {
      success: false,
      error: "Could not upload proof of delivery. Please try again.",
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROOF_BUCKET).getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("delivery")
    .update({
      delivery_status: "delivered",
      completed_at: new Date().toISOString(),
      proof_of_delivery: publicUrl,
    })
    .eq("delivery_id", deliveryId);

  if (updateError) {
    return {
      success: false,
      error:
        "Proof was uploaded, but we couldn't update the delivery. Please try again.",
    };
  }

  // The cash is in the rider's hand, so the order is paid. Without this the
  // books would show every completed cash delivery as still pending, and the
  // receipt would keep telling the customer nothing had been taken.
  if (cashDue) {
    const { error: cashError } = await admin
      .from("transaction")
      .update({
        payment_status: "paid",
        // `subtotal` is what `submitCart` recorded for the goods. The
        // delivery fee lives on the order, so it is added back here rather
        // than recomputed — this must agree with the figure the customer was
        // shown at checkout.
        total_paid: (cashDue.subtotal ?? 0) + (orderDeliveryFee ?? 0),
        transaction_date: new Date().toISOString(),
      })
      .eq("transaction_id", cashDue.transaction_id);

    if (cashError) {
      console.error("markDelivered: could not record cash payment:", cashError);
    }
  }

  // Reflect the completed status back to the original order record
  // Riders have no UPDATE access to `order` (003_kitchen_queue_rls.sql), so
  // a session-scoped update here is silently filtered to zero rows. The
  // rider's assignment to this delivery was verified above, so the status
  // change is made with the service role, scoped to that one order.
  if (delivery.order_id) {
    const { error: orderUpdateError } = await admin
      .from("order")
      .update({
        order_status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("order_id", delivery.order_id);

    if (orderUpdateError) {
      console.error("markDelivered: could not complete order:", orderUpdateError);
    }
  }

  revalidatePath("/deliver");
  revalidatePath("/deliver/[deliveryId]", "page");

  return { success: true, error: null };
}

/**
 * Order10: Atomically accept a pending delivery.
 *
 * A rider may hold as many deliveries as they accept — the only condition is
 * that this one is still unassigned, which is checked inside the UPDATE so two
 * riders tapping at once cannot both win it. Anything they take can be handed
 * back again with `releaseDelivery`.
 */
export async function acceptDelivery(deliveryId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const rider = await getCurrentRider(supabase);
  
  if (!rider) {
    return { success: false, error: "You must be signed in as a rider to accept deliveries." };
  }

  // Atomic update: Only succeeds if rider_id is still exactly NULL
  const { data, error } = await supabase
    .from("delivery")
    .update({
      rider_id: rider.rider_id,
      delivery_status: "delivering" // Updating status to match the active queue
    })
    .eq("delivery_id", deliveryId)
    .is("rider_id", null)
    .select()
    .single();

  if (error || !data) {
    return { 
      success: false, 
      error: "This order was just accepted by another rider or is no longer available." 
    };
  }
  revalidatePath("/deliver", "layout");

  return { success: true, error: null };
}

/**
 * Order10: hand an accepted delivery back to the queue.
 *
 * For the rider who tapped Accept by mistake, or who can no longer take it:
 * the delivery becomes unassigned and waiting again, so any other rider —
 * including this one — sees it in their queue immediately.
 *
 * Only the rider carrying it can do this, and only before it is delivered;
 * `canReleaseDelivery` states both rules and `releaseRefusalReason` supplies
 * the message. The rider's other accepted deliveries are untouched.
 *
 * The order row is deliberately left alone. Staff already sent it out for
 * delivery, and that is still true — it simply needs a rider again.
 */
export async function releaseDelivery(
  deliveryId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const rider = await getCurrentRider(supabase);

  if (!rider) {
    return {
      success: false,
      error: "You must be signed in as a rider to do that.",
    };
  }

  const { data: delivery, error: lookupError } = await supabase
    .from("delivery")
    .select("delivery_id, rider_id, delivery_status")
    .eq("delivery_id", deliveryId)
    .maybeSingle();

  if (lookupError || !delivery) {
    return { success: false, error: "Delivery not found." };
  }

  const assignment = {
    assignedRiderId: delivery.rider_id,
    status: delivery.delivery_status,
  };
  const refusal = releaseRefusalReason(assignment, rider.rider_id);
  if (refusal) {
    return { success: false, error: refusal };
  }

  // `rider_id` is matched in the UPDATE as well, so a release racing anything
  // else touching the row cannot take it off a rider it no longer belongs to.
  const { data: released, error: updateError } = await supabase
    .from("delivery")
    .update({
      rider_id: null,
      delivery_status: RELEASED_DELIVERY_STATUS,
    })
    .eq("delivery_id", deliveryId)
    .eq("rider_id", rider.rider_id)
    .select("delivery_id")
    .maybeSingle();

  if (updateError || !released) {
    return {
      success: false,
      error: "Couldn't hand this delivery back. Please try again.",
    };
  }

  revalidatePath("/deliver", "layout");

  return { success: true, error: null };
}
