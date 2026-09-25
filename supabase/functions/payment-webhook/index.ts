// supabase/functions/payment-webhook/index.ts
//
// Deno Edge Function (AC2). Public endpoint PayMongo POSTs to directly.
// Authenticated via Paymongo-Signature header (HMAC-SHA256).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("Paymongo-Signature");
  const webhookSecret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");

  if (!signatureHeader || !webhookSecret) {
    return new Response("Missing signature.", { status: 400 });
  }

  const isValid = await verifyPaymongoSignature(
    rawBody,
    signatureHeader,
    webhookSecret,
  );

  if (!isValid) {
    console.error("payment-webhook: signature verification failed.");
    return new Response("Invalid signature.", { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON.", { status: 400 });
  }

  // Handle both array-wrapped payloads (PayMongo webhook_process) and single objects
  let webhookItem = event?.data;
  if (Array.isArray(webhookItem)) {
    webhookItem = webhookItem[0];
  }

  const eventType: string | undefined =
    webhookItem?.attributes?.event_type ??
    webhookItem?.attributes?.type ??
    event?.type;

  // Safely extract resource_id first, falling back to item or event IDs
  const resourceId: string | undefined =
    webhookItem?.attributes?.resource_id ??
    webhookItem?.id ??
    event?.data?.id;

  console.log("Webhook parsed - Event Type:", eventType, "Resource ID:", resourceId);

  if (!eventType || (eventType !== "payment.paid" && eventType !== "payment.failed")) {
    return new Response("ok", { status: 200 });
  }

  const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
  let paymentIntentId: string | undefined;
  let orderId: string | undefined;
  let amountPaid: number | undefined;

  if (paymongoSecretKey && resourceId && !resourceId.startsWith("evt_")) {
    try {
      let endpoint = `https://api.paymongo.com/v1/payments/${resourceId}`;
      if (resourceId.startsWith("pi_")) {
        endpoint = `https://api.paymongo.com/v1/payment_intents/${resourceId}`;
      }

      const paymongoRes = await fetch(endpoint, {
        headers: {
          Authorization: "Basic " + btoa(`${paymongoSecretKey}:`),
        },
      });

      if (paymongoRes.ok) {
        const responseData = await paymongoRes.json();
        const attributes = responseData?.data?.attributes;
        amountPaid = attributes?.amount;
        paymentIntentId = attributes?.payment_intent_id ?? responseData?.data?.id;
        orderId = attributes?.metadata?.order_id;
      }
    } catch (err) {
      console.log("PayMongo API fetch skipped or failed for test ID:", err);
    }
  }

  // Service-role client to bypass RLS
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const newStatus = eventType === "payment.paid" ? "paid" : "failed";

  let query = supabase
    .from("transaction")
    .update({
      payment_status: newStatus,
      ...(newStatus === "paid" && typeof amountPaid === "number"
        ? { total_paid: amountPaid / 100 }
        : {}),
    })
    .eq("payment_status", "pending");

  if (paymentIntentId) {
    query = query.eq("provider_reference_id", paymentIntentId);
  } else if (orderId) {
    query = query.eq("order_id", orderId);
  } else if (resourceId && !resourceId.startsWith("evt_")) {
    query = query.eq("provider_reference_id", resourceId);
  }

  const { data: updatedRows, error } = await query.select();

  console.log("Database Update Result - Matched Rows:", updatedRows, "Error:", error);

  if (error) {
    console.error("payment-webhook: failed to update transaction:", error);
  }

  // The transaction row is only half the story. `submitCart` now parks a
  // wallet order at `awaiting_payment` so the kitchen and the rider queue
  // never see a payment that has not landed, which makes this webhook the
  // thing that releases it — or marks it refused. Without this half the order
  // would stay invisible forever (issue #106).
  //
  // These strings mirror `ORDER_STATUSES` in `lib/validation/orders.ts`. Edge
  // functions run on Deno and cannot import from the Next app, so they are
  // repeated here; change both together.
  const orderIds = [
    ...new Set(
      (updatedRows ?? [])
        .map((row: { order_id: string | null }) => row.order_id)
        .filter((id: string | null): id is string => Boolean(id)),
    ),
  ];

  if (orderIds.length > 0) {
    const nextOrderStatus = newStatus === "paid" ? "pending" : "payment_failed";

    const { error: orderError } = await supabase
      .from("order")
      .update({ order_status: nextOrderStatus })
      .in("order_id", orderIds)
      // Only ever move an order that is still waiting on this payment.
      // PayMongo can deliver a webhook late or twice, and staff may already
      // have pushed a paid order on to `preparing` — or the customer may have
      // given up and switched to cash on delivery. Neither should be dragged
      // backwards by a stale delivery, so the update is scoped to the two
      // statuses that genuinely mean "still unpaid".
      .in("order_status", ["awaiting_payment", "payment_failed"]);

    if (orderError) {
      console.error("payment-webhook: failed to update order status:", orderError);
    }
  }

  return new Response("ok", { status: 200 });
});

async function verifyPaymongoSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => part.split("=") as [string, string]),
  );

  const timestamp = parts.t;
  const testSignature = parts.te;

  if (!timestamp || !testSignature) return false;

  const signedPayload = `${timestamp}.${rawBody}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload),
  );

  const computedHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(computedHex, testSignature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}