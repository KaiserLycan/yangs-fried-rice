/**
 * AC5: simulates PayMongo payment.paid and payment.failed webhook
 * deliveries, with a correctly-computed Paymongo-Signature header, so the
 * payment-webhook edge function can be tested without needing PayMongo to
 * actually send anything.
 *
 * Usage (run with Node, has no external dependencies beyond Node's
 * built-in crypto and fetch):
 *
 *   node scripts/simulate-paymongo-webhook.js paid <order_id> <webhook_url> <webhook_secret>
 *   node scripts/simulate-paymongo-webhook.js failed <order_id> <webhook_url> <webhook_secret>
 *
 * Example, testing a locally-served function:
 *   supabase functions serve payment-webhook --env-file supabase/.env.local
 *   node scripts/simulate-paymongo-webhook.js paid order-123 \
 *     http://localhost:54321/functions/v1/payment-webhook whsk_test_fake
 *
 * The webhook_secret here just needs to MATCH whatever
 * PAYMONGO_WEBHOOK_SECRET the function is running with — for local
 * testing this can be any string you both agree on; it does not need to
 * be a real PayMongo secret until you're testing against a real
 * registered webhook.
 */

const crypto = require("crypto");

const [, , outcome, orderId, webhookUrl, webhookSecret] = process.argv;

if (!outcome || !orderId || !webhookUrl || !webhookSecret) {
  console.error(
    "Usage: node simulate-paymongo-webhook.js <paid|failed> <order_id> <webhook_url> <webhook_secret>",
  );
  process.exit(1);
}
if (outcome !== "paid" && outcome !== "failed") {
  console.error("First argument must be 'paid' or 'failed'.");
  process.exit(1);
}

const eventType = outcome === "paid" ? "payment.paid" : "payment.failed";
const paymentIntentId = `pi_test_${Math.random().toString(36).slice(2, 10)}`;

// Best-effort match to the payload shape documented by PayMongo —
// see the NOTE in payment-webhook/index.ts if this needs adjusting
// after a real test webhook delivery is inspected.
const payload = {
  data: {
    id: `evt_test_${Math.random().toString(36).slice(2, 10)}`,
    type: "event",
    attributes: {
      type: eventType,
      data: {
        id: `pay_test_${Math.random().toString(36).slice(2, 10)}`,
        type: "payment",
        attributes: {
          amount: 18500, // ₱185.00 in centavos
          currency: "PHP",
          status: outcome === "paid" ? "paid" : "failed",
          payment_intent_id: paymentIntentId,
          metadata: { order_id: orderId },
        },
      },
    },
  },
};

const rawBody = JSON.stringify(payload);
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${rawBody}`;

const testSignature = crypto
  .createHmac("sha256", webhookSecret)
  .update(signedPayload)
  .digest("hex");

// Live signature isn't meaningfully computable without a live secret —
// this script is for test-mode verification, matching what
// payment-webhook/index.ts actually checks (the `te` value).
const signatureHeader = `t=${timestamp},te=${testSignature},li=unused_in_test_mode`;

async function main() {
  console.log(`Sending simulated ${eventType} for order ${orderId}...`);

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Paymongo-Signature": signatureHeader,
    },
    body: rawBody,
  });

  const text = await res.text();
  console.log(`Response: ${res.status} ${text}`);

  if (res.ok) {
    console.log(
      `Now check your transaction table: the row for order_id="${orderId}" ` +
        `should show payment_status="${outcome}".`,
    );
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});