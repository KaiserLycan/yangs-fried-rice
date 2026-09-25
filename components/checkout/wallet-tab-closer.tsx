"use client";

import * as React from "react";
import { isDisposableWalletTab } from "@/lib/checkout/wallet-tab";

/**
 * Closes the throwaway tab a wallet payment happened in.
 *
 * Checkout opens the wallet beside itself rather than navigating away, so
 * that PayMongo's dead ends cost a tab switch instead of the whole order.
 * The cost of that is a second tab: on a payment that *does* come back,
 * PayMongo sends its tab to `return_url`, leaving the customer looking at
 * two copies of the same receipt.
 *
 * So the tab that was opened for the payment closes itself once it has
 * served its purpose — authorised or refused, either way the answer is now
 * in the database and the customer's own tab is watching for it. That tab
 * polls `transaction` and re-reads whenever it regains focus, which is what
 * closing this one causes, so nothing needs to be handed back.
 *
 * Three things must all be true before anything closes, because closing the
 * customer's real tab would be much worse than leaving a spare one open:
 *
 *   - the URL carries the marker checkout adds only when it opened a tab,
 *   - `window.opener` is present and still open, which is only true of a
 *     script-opened window — and is also what browsers require before
 *     honouring `window.close()`,
 *   - the receipt behind this renders regardless, so a browser that refuses
 *     to close leaves the customer on a perfectly good page.
 */
export function WalletTabCloser({ active }: { active: boolean }) {
  React.useEffect(() => {
    if (!active || !isDisposableWalletTab()) return;
    window.close();
  }, [active]);

  return null;
}
