// supabase/functions/payment-webhook/index.ts
//
// Deno Edge Function (AC2). Public endpoint PayMongo POSTs to directly —
// no customer JWT, no CORS restriction needed (PayMongo's servers call
// this, not a browser). Authenticity is verified entirely via the
// Paymongo-Signature header (HMAC-SHA256), per PayMongo's own go-live
// checklist: verify the signature BEFORE any JSON parsing, since any byte
// changed before verification breaks the check on a legitimate request.
//
// Deploy: supabase functions deploy payment-webhook --no-verify-jwt
//   --no-verify-jwt is required — Supabase normally demands a Supabase
//   auth JWT on every function call, but PayMongo obviously can't send
//   one. Authenticity here comes entirely from the signature check below,
//   not from Supabase's own auth layer.
//
// Secrets:
//   supabase secrets set PAYMONGO_WEBHOOK_SECRET=whsk_...
//   (shown once in PayMongo Dashboard -> Developer Tools -> Webhooks,
//   when the endpoint is registered there)
//
// After deploying, register the resulting URL in PayMongo's dashboard
// (Developer Tools -> Webhooks -> Add Endpoint) for payment.paid and
// payment.failed. The dashboard displays the webhook secret ONLY at that
// point — copy it immediately into the secrets command above.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Raw text, captured before any JSON parsing — required for signature
  // verification to match what PayMongo actually signed.
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

  // Only safe to parse JSON now that the signature is confirmed to match
  // this exact raw body.
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON.", { status: 400 });
  }

  const eventType: string | undefined = event?.data?.attributes?.type;
  // NOTE: PayMongo's docs show the payload as
  //   { data: { attributes: { type: "payment.paid", data: { ... } } } }
  // but didn't show the full inner shape at the time this was written.
  // The inner resource is expected at attributes.data.data.attributes
  // (id, amount, metadata, payment_intent_id) based on how PayMongo
  // structures its other resource responses — CONFIRM this against a
  // real "Send test webhook" delivery from the PayMongo dashboard before
  // trusting it in production, and adjust the extraction below if the
  // actual nesting differs.
  const resource = event?.data?.attributes?.data;
  const resourceAttributes = resource?.attributes ?? resource?.data?.attributes;
  const orderId: string | undefined = resourceAttributes?.metadata?.order_id;
  const paymentIntentId: string | undefined =
    resourceAttributes?.payment_intent_id ?? resource?.id;

  if (!eventType || (eventType !== "payment.paid" && eventType !== "payment.failed")) {
    // Not an event this function cares about — acknowledge anyway so
    // PayMongo doesn't retry something we deliberately ignore.
    return new Response("ok", { status: 200 });
  }

  if (!orderId && !paymentIntentId) {
    console.error(
      "payment-webhook: could not extract order_id or payment_intent_id from payload.",
      JSON.stringify(event),
    );
    // Acknowledge with 200 anyway — retrying won't fix a payload we
    // can't parse, and this is exactly the case the NOTE above exists
    // for. Logged for manual follow-up instead.
    return new Response("ok", { status: 200 });
  }

  // Service-role client — this function has no user session to inherit,
  // and needs to write regardless of RLS.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const newStatus = eventType === "payment.paid" ? "paid" : "failed";
  const amountCentavos: number | undefined = resourceAttributes?.amount;

  let query = supabase
    .from("transaction")
    .update({
      payment_status: newStatus,
      ...(newStatus === "paid" && typeof amountCentavos === "number"
        ? { total_paid: amountCentavos / 100 }
        : {}),
    })
    // Idempotency: only update a transaction that's still pending. A
    // retried webhook delivery for an already-processed event becomes a
    // harmless no-op instead of double-applying the update.
    .eq("payment_status", "pending");

  query = paymentIntentId
    ? query.eq("provider_reference_id", paymentIntentId)
    : query.eq("order_id", orderId!);

  const { error } = await query;

  if (error) {
    console.error("payment-webhook: failed to update transaction:", error);
    // Still 200 — PayMongo retries on non-2xx, and retrying a DB error
    // that isn't transient won't help. Logged for manual follow-up.
  }

  // Deliberately does NOT touch order.order_status. That field belongs
  // to the kitchen-queue flow (lib/actions/orders.ts, a different
  // teammate's work) — payment success/failure is tracked purely on
  // `transaction`, kept as a separate concern.
  return new Response("ok", { status: 200 });
});

/**
 * Verifies PayMongo's Paymongo-Signature header against the raw body.
 * Header format: "t=<timestamp>,te=<test_signature>,li=<live_signature>"
 * Signed string: "<timestamp>.<raw_body>", HMAC-SHA256 with the webhook
 * secret, hex-encoded.
 *
 * Compares against `te` (test-mode signature) since this project is on
 * PayMongo test keys. Switch to comparing `li` once the integration goes
 * live with production keys — don't compare both, since PayMongo does
 * not send a live signature for a test-mode event or vice versa.
 */
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

/** Constant-time string comparison — a naive === leaks timing info that
 *  can theoretically help an attacker guess the correct signature byte
 *  by byte. Always compares the full length of both strings regardless
 *  of where they first differ. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}