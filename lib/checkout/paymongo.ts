"use client";

import { FunctionsHttpError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { WalletProvider } from "@/lib/checkout/payment-methods";

/**
 * Starts an online payment for an order that already exists (GitHub #9,
 * PP1). Three round trips, in this order:
 *
 *   1. `create-payment-intent` (the backend's edge function, PR #79) — works
 *      out the amount server-side, creates the PayMongo Payment Intent and
 *      records a pending `transaction`. Returns the intent id and a
 *      `client_key`.
 *   2. PayMongo `payment_methods` — a GCash or Maya payment method, made in
 *      the browser with the **public** key. No secret leaves the server.
 *   3. PayMongo `payment_intents/:id/attach` — ties the two together. For a
 *      wallet the answer is always a redirect URL: the customer pays on
 *      GCash / Maya's own page and comes back to `returnUrl`.
 *
 * Whether the payment then succeeded is not known here. PayMongo tells the
 * backend's webhook, which flips `transaction.payment_status`, and the
 * confirmation screen watches that row.
 *
 * Cards are not handled: they need a card-entry form no frame draws yet.
 */

export type PaymentStart =
  | { kind: "redirect"; url: string }
  | { kind: "paid" }
  /** PayMongo took the attach but has not answered yet — the webhook will. */
  | { kind: "pending" };

const PAYMONGO_API = "https://api.paymongo.com/v1";
const NOT_CONFIGURED = "Online payment isn’t set up on this site yet.";

/**
 * True when the browser has what it needs to start a wallet payment. The
 * guard on "Place order" asks this first, so a site with no key refuses a
 * wallet order before `submitCart` has locked the cart behind it.
 */
export function isOnlinePaymentConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY);
}

export async function startWalletPayment({
  orderId,
  wallet,
  returnUrl,
}: {
  orderId: string;
  wallet: WalletProvider;
  returnUrl: string;
}): Promise<PaymentStart> {
  const publicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY;
  if (!publicKey) throw new Error(NOT_CONFIGURED);

  const intent = await createPaymentIntent(orderId);

  const paymentMethodId = await paymongo<{ data: { id: string } }>(
    publicKey,
    "/payment_methods",
    { data: { attributes: { type: wallet } } },
  ).then((body) => body.data.id);

  const attached = await paymongo<{
    data: {
      attributes: {
        status: string;
        next_action?: { redirect?: { url?: string } } | null;
        last_payment_error?: { failed_message?: string } | null;
      };
    };
  }>(publicKey, `/payment_intents/${intent.payment_intent_id}/attach`, {
    data: {
      attributes: {
        payment_method: paymentMethodId,
        client_key: intent.client_key,
        return_url: returnUrl,
      },
    },
  });

  const { status, next_action, last_payment_error } = attached.data.attributes;
  const redirectUrl = next_action?.redirect?.url;

  if (status === "awaiting_next_action" && redirectUrl) {
    return { kind: "redirect", url: redirectUrl };
  }
  if (status === "succeeded") return { kind: "paid" };
  if (status === "processing") return { kind: "pending" };

  throw new Error(
    last_payment_error?.failed_message ??
      "The wallet did not accept this payment. Please try again.",
  );
}

async function createPaymentIntent(orderId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<{
    payment_intent_id: string;
    client_key: string;
  }>("create-payment-intent", { body: { order_id: orderId } });

  if (error) {
    // A non-2xx reply carries the function's own `{ error }` message in its
    // body — "This order has already been paid.", say — which is what the
    // customer should read, not the generic "Edge Function returned a
    // non-2xx status code".
    let message = "Couldn’t start the payment. Please try again.";
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      if (typeof body?.error === "string") message = body.error;
    }
    throw new Error(message);
  }
  if (!data?.payment_intent_id || !data.client_key) {
    throw new Error("The payment service gave an unexpected reply.");
  }
  return data;
}

/** One PayMongo call with the public key. Their errors arrive as `errors[0].detail`. */
async function paymongo<T>(
  publicKey: string,
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${PAYMONGO_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${publicKey}:`)}`,
    },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      json?.errors?.[0]?.detail ?? "The payment gateway refused the request.",
    );
  }
  return json as T;
}
