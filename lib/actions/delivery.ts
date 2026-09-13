"use server";

import { createClient } from "@/lib/supabase/server";

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
};

type DeliveryDetail = {
  deliveryId: string;
  deliveryStatus: string | null;
  estimatedTime: string | null;
  proofOfDelivery: string | null;
  customer: { name: string; address: string | null } | null;
  items: { productName: string; quantity: number }[];
};

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
  const supabase = createClient();
  const rider = await getCurrentRider(supabase);
  if (!rider) {
    return {
      deliveries: [],
      error: "You need to be signed in as a rider to see this.",
    };
  }

  const { data, error } = await supabase
    .from("delivery")
    .select("delivery_id, order_id, delivery_status, estimated_time")
    .eq("rider_id", rider.rider_id)
    .neq("delivery_status", "delivered")
    .order("estimated_time", { ascending: true, nullsFirst: false });

  if (error) {
    return { deliveries: [], error: "Could not load your deliveries." };
  }

  return {
    deliveries: data.map((d) => ({
      deliveryId: d.delivery_id,
      orderId: d.order_id,
      deliveryStatus: d.delivery_status,
      estimatedTime: d.estimated_time,
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

  if (deliveryError || !delivery || delivery.rider_id !== rider.rider_id) {
    return { delivery: null, error: "Delivery not found." };
  }

  let customer: { name: string; address: string | null } | null = null;
  let items: { productName: string; quantity: number }[] = [];

  if (delivery.order_id) {
    const { data: order } = await supabase
      .from("order")
      .select("customer_id")
      .eq("order_id", delivery.order_id)
      .single();

    if (order?.customer_id) {
      const { data: customerRow } = await supabase
        .from("customer")
        .select("name")
        .eq("customer_id", order.customer_id)
        .single();

      const { data: addressRow } = await supabase
        .from("customer_address")
        .select("address_details")
        .eq("customer_id", order.customer_id)
        .single();

      if (customerRow) {
        customer = {
          name: customerRow.name,
          address: addressRow?.address_details ?? null,
        };
      }
    }

    const { data: orderItems } = await supabase
      .from("order_item")
      .select("quantity, product:product_id (product_name)")
      .eq("order_id", delivery.order_id);

    items = (orderItems ?? []).map((item) => ({
      productName: item.product?.product_name ?? "Unknown item",
      quantity: item.quantity,
    }));
  }

  return {
    delivery: {
      deliveryId: delivery.delivery_id,
      deliveryStatus: delivery.delivery_status,
      estimatedTime: delivery.estimated_time,
      proofOfDelivery: delivery.proof_of_delivery,
      customer,
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
    .select("delivery_id, rider_id, delivery_status")
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

  const proofFile = formData.get("proof");
  if (!(proofFile instanceof File) || proofFile.size === 0) {
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

  return { success: true, error: null };
}