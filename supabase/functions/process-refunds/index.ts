// supabase/functions/process-refunds/index.ts
//
// Deno Edge Function (issue #115). Sends PayMongo refunds for paid wallet
// orders that were cancelled.
//
// A transaction reaches `refund_pending` two ways, both in the database:
//   * trg_flag_refund_on_cancel — a paid order was cancelled by the
//     customer, by staff, or by expire_unaccepted_orders() (20 minutes
//     unaccepted), 20260928000004 / 20260928000009;
//   * payment-webhook — PayMongo confirmed a payment for an order that was
//     already cancelled.
//
// pg_cron calls this every 5 minutes through pg_net
// (20260928000010_schedule_cron_jobs.sql). It is not a public endpoint in
// any useful sense: without the shared secret in `x-cron-secret` it does
// nothing. Deploy with --no-verify-jwt (pg_cron sends no Supabase JWT).
//
// Secrets (Edge Functions → Secrets): PAYMONGO_SECRET_KEY (already set for
// the other two functions) and REFUND_CRON_SECRET (must equal the Vault
// secret `refund_cron_secret`). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// are provided by Supabase.
//
// Each row ends in one of:
//   refunded       PayMongo accepted the refund; provider_refund_id is set.
//   refund_failed  PayMongo refused, or no payment id could be found;
//                  refund_error says why. A manager refunds by hand in the
//                  PayMongo dashboard (the manager dashboard lists these).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYMONGO_API = "https://api.paymongo.com";
/** Rows per run. Refunds are rare; this only bounds a backlog. */
const BATCH_SIZE = 20;

type RefundRow = {
  transaction_id: string;
  order_id: string | null;
  total_paid: number | null;
  tip_amount: number | null;
  subtotal: number | null;
  provider_reference_id: string | null;
  provider_payment_id: string | null;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const cronSecret = Deno.env.get("REFUND_CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
  if (!paymongoSecretKey) {
    console.error("process-refunds: PAYMONGO_SECRET_KEY is not set");
    return new Response("Not configured", { status: 500 });
  }
  const auth = "Basic " + btoa(`${paymongoSecretKey}:`);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: rows, error } = await supabase
    .from("transaction")
    .select(
      "transaction_id, order_id, total_paid, subtotal, tip_amount, provider_reference_id, provider_payment_id",
    )
    .eq("payment_status", "refund_pending")
    .order("transaction_date", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("process-refunds: could not read refund queue:", error);
    return new Response("Read failed", { status: 500 });
  }

  let refunded = 0;
  let failed = 0;

  for (const row of (rows ?? []) as RefundRow[]) {
    const outcome = await refundOne(row, auth);

    // Scoped to refund_pending so two overlapping runs cannot both write,
    // and a row a manager already settled by hand is left alone.
    const { error: writeError } = await supabase
      .from("transaction")
      .update(
        outcome.ok
          ? {
              payment_status: "refunded",
              provider_refund_id: outcome.refundId,
              provider_payment_id: outcome.paymentId,
              refunded_at: new Date().toISOString(),
              refund_error: null,
            }
          : {
              payment_status: "refund_failed",
              refund_error: outcome.error,
              ...(outcome.paymentId ? { provider_payment_id: outcome.paymentId } : {}),
            },
      )
      .eq("transaction_id", row.transaction_id)
      .eq("payment_status", "refund_pending");

    if (writeError) {
      // The refund may have gone through at PayMongo; log loudly so it is
      // not sent twice by hand. The next run would retry it, and PayMongo
      // refuses a refund larger than what is left on the payment.
      console.error(
        "process-refunds: refund outcome not recorded for",
        row.transaction_id,
        outcome,
        writeError,
      );
    }

    if (outcome.ok) refunded++;
    else failed++;
  }

  console.log("process-refunds:", { checked: rows?.length ?? 0, refunded, failed });
  return Response.json({ checked: rows?.length ?? 0, refunded, failed });
});

type Outcome =
  | { ok: true; refundId: string; paymentId: string }
  | { ok: false; error: string; paymentId: string | null };

async function refundOne(row: RefundRow, auth: string): Promise<Outcome> {
  // PayMongo amounts are centavos. total_paid is what the webhook recorded
  // from PayMongo; subtotal is the fallback for rows paid before that.
  // total_paid is the sale; the staff tip was charged on top (F19) and goes back too.
  const pesos =
    (Number(row.total_paid) > 0 ? Number(row.total_paid) : Number(row.subtotal)) + Number(row.tip_amount ?? 0);
  const amount = Math.round(pesos * 100);
  if (!Number.isFinite(amount) || amount < 100) {
    return { ok: false, error: `Amount ₱${pesos} is below PayMongo's ₱1 minimum.`, paymentId: null };
  }

  let paymentId = row.provider_payment_id;
  if (!paymentId && row.provider_reference_id) {
    paymentId = await paymentIdFromIntent(row.provider_reference_id, auth);
  }
  if (!paymentId) {
    return {
      ok: false,
      error: "No PayMongo payment found for this transaction.",
      paymentId: null,
    };
  }

  try {
    const res = await fetch(`${PAYMONGO_API}/refunds`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          attributes: {
            amount,
            payment_id: paymentId,
            reason: "others",
            notes: "Order cancelled — automatic refund (Yang's Fried Rice).",
            metadata: { order_id: row.order_id ?? "" },
          },
        },
      }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const detail =
        body?.errors?.[0]?.detail ?? body?.errors?.[0]?.code ?? `HTTP ${res.status}`;
      return { ok: false, error: `PayMongo refused the refund: ${detail}`, paymentId };
    }

    const refundId = body?.data?.id;
    if (!refundId) {
      return { ok: false, error: "PayMongo returned no refund id.", paymentId };
    }
    return { ok: true, refundId, paymentId };
  } catch (err) {
    return { ok: false, error: `Could not reach PayMongo: ${String(err)}`, paymentId };
  }
}

/**
 * The refund needs the payment (pay_…), but the transaction row may only
 * hold the payment intent (pi_…): rows paid before payment-webhook stored
 * the payment id. The intent lists its payments; take the one that paid.
 */
async function paymentIdFromIntent(intentId: string, auth: string): Promise<string | null> {
  if (!intentId.startsWith("pi_")) return null;
  try {
    const res = await fetch(`${PAYMONGO_API}/v1/payment_intents/${intentId}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const payments: { id?: string; attributes?: { status?: string } }[] =
      body?.data?.attributes?.payments ?? [];
    const paid = payments.find((p) => p.attributes?.status === "paid") ?? payments[0];
    return paid?.id ?? null;
  } catch {
    return null;
  }
}
