// supabase/functions/create-payment-intent/index.ts
//
// Deno Edge Function (AC1). Called by an authenticated customer to start
// paying for an order. The amount is ALWAYS computed server-side from
// order_item.subtotal + order.delivery_fee — never trust a client-supplied
// amount for a payment, or a tampered request could pay less than owed.
//
// Deploy: supabase functions deploy create-payment-intent
// Secrets (set once, NOT in .env.local — these are Supabase Function
// secrets, a different mechanism entirely):
//   supabase secrets set PAYMONGO_SECRET_KEY=sk_test_...
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by
// the Supabase platform into every edge function — no need to set them.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header." }, 401);
    }

    // Scoped to the caller's own JWT — auth.getUser() and any RLS-guarded
    // query below run as this customer, not as an admin.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return json({ error: "You must be signed in." }, 401);
    }

    const body = await req.json().catch(() => null);
    const orderId = body?.order_id;
    if (!orderId || typeof orderId !== "string") {
      return json({ error: "order_id is required." }, 400);
    }

    // Confirm the order exists, belongs to this customer, and isn't
    // already paid — relies on the order SELECT policy from migration 001
    // (customer_select_own_orders) to naturally return nothing if this
    // order belongs to someone else.
    const { data: order, error: orderError } = await supabase
      .from("order")
      .select("order_id, customer_id, delivery_fee, order_status")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return json({ error: "Order not found." }, 404);
    }
    if (order.order_status === "cancelled") {
      return json({ error: "This order has been cancelled." }, 400);
    }

    const { data: existingTransaction } = await supabase
      .from("transaction")
      .select("transaction_id, payment_status")
      .eq("order_id", orderId)
      .eq("payment_status", "paid")
      .maybeSingle();

    if (existingTransaction) {
      return json({ error: "This order has already been paid." }, 400);
    }

    // Sum order_item.subtotal server-side — this is the amount actually
    // owed, independent of anything the client claims.
    const { data: items, error: itemsError } = await supabase
      .from("order_item")
      .select("subtotal")
      .eq("order_id", orderId);

    if (itemsError) {
      return json({ error: "Could not read order items." }, 500);
    }

    const itemsTotal = (items ?? []).reduce(
      (sum: number, item: { subtotal: number }) => sum + item.subtotal,
      0,
    );
    const totalPesos = itemsTotal + (order.delivery_fee ?? 0);
    const amountCentavos = Math.round(totalPesos * 100);

    if (amountCentavos <= 0) {
      return json({ error: "Order total must be greater than zero." }, 400);
    }

    const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!paymongoSecretKey) {
      return json({ error: "Payment gateway is not configured." }, 500);
    }

    const paymongoRes = await fetch(
      "https://api.paymongo.com/v1/payment_intents",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${paymongoSecretKey}:`),
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: amountCentavos,
              currency: "PHP",
              payment_method_allowed: ["card", "gcash", "paymaya"],
              description: `Order ${orderId}`,
              // NOTE: verify this metadata object actually round-trips
              // into the webhook payload via a real "Send test webhook"
              // in the PayMongo dashboard before relying on it in
              // production — PayMongo's docs didn't show the full nested
              // payload shape at the time this was written.
              metadata: { order_id: orderId },
            },
          },
        }),
      },
    );

    const paymongoData = await paymongoRes.json();

    if (!paymongoRes.ok) {
      return json(
        {
          error:
            paymongoData?.errors?.[0]?.detail ??
            "Could not create payment with the gateway.",
        },
        502,
      );
    }

    const paymentIntentId = paymongoData.data.id;
    const clientKey = paymongoData.data.attributes.client_key;

    // Reuse an existing PENDING transaction for this order if one exists
    // (e.g. the customer's connection dropped mid-payment and they're
    // retrying) rather than blindly upserting on order_id — an order can
    // legitimately have more than one transaction row over its lifetime
    // (a failed attempt followed by a successful one, a future refund),
    // so order_id is deliberately NOT a unique constraint.
    const { data: pendingTransaction } = await supabase
      .from("transaction")
      .select("transaction_id")
      .eq("order_id", orderId)
      .eq("payment_status", "pending")
      .maybeSingle();

    const transactionPayload = {
      order_id: orderId,
      payment_status: "pending",
      payment_method: "paymongo",
      subtotal: totalPesos,
      provider_reference_id: paymentIntentId,
      transaction_type: "payment",
      transaction_date: new Date().toISOString(),
    };

    const { error: transactionError } = pendingTransaction
      ? await supabase
          .from("transaction")
          .update(transactionPayload)
          .eq("transaction_id", pendingTransaction.transaction_id)
      : await supabase.from("transaction").insert(transactionPayload);

    if (transactionError) {
      return json(
        { error: "Could not record the pending transaction." },
        500,
      );
    }

    return json({
      payment_intent_id: paymentIntentId,
      client_key: clientKey,
      amount_centavos: amountCentavos,
    });
  } catch (err) {
    console.error("create-payment-intent error:", err);
    return json({ error: "Unexpected server error." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}