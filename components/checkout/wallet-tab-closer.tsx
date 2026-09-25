"use client";

import * as React from "react";
import {
  anotherTabIsWatching,
  answerAsWatcher,
  hasLiveOpener,
} from "@/lib/checkout/wallet-tab";

/**
 * Closes the throwaway tab a wallet payment happened in.
 *
 * Checkout opens the wallet beside itself rather than navigating away, so
 * that PayMongo's dead ends cost a tab switch instead of the whole order.
 * The cost of that is a second tab: on a payment that *does* come back,
 * PayMongo sends its tab to `return_url`, leaving the customer looking at
 * two copies of the same receipt.
 *
 * So the tab opened for the payment closes itself once it has served its
 * purpose — authorised or refused, either way the answer is in the database
 * and the customer's own tab is watching for it. That tab polls
 * `transaction` and re-reads whenever it regains focus, which is what
 * closing this one causes, so nothing needs to be handed back.
 *
 * **Which tab is which.** `active` comes from a marker checkout puts on the
 * `return_url`, and only when it actually opened a tab. So the customer's
 * own receipt renders this with `active` false and becomes the watcher; the
 * tab that comes back from PayMongo renders it with `active` true and tries
 * to leave.
 *
 * **Why not just `window.opener`.** That was the first attempt and it did
 * not work: a provider sending `Cross-Origin-Opener-Policy: same-origin`
 * severs the opener for good, so the tab comes home unable to prove it was
 * ever opened by us. The opener is still checked first because when it
 * survives it is instant and free — but the real question is whether
 * another tab is already watching this order, and that one can be asked
 * over a BroadcastChannel, between two documents on our own origin, where
 * PayMongo's headers have no say.
 *
 * **Why this cannot close the wrong tab.** Closing the customer's real
 * receipt would be far worse than leaving a spare tab open, so nothing
 * closes unless a *different* tab answers that it is watching this same
 * order. When the popup was blocked there is only one tab, nobody answers,
 * and it stays. The receipt renders either way, so a browser that refuses
 * `window.close()` leaves a usable page rather than a blank one.
 */
export function WalletTabCloser({
  active,
  orderId,
}: {
  active: boolean;
  orderId: string;
}) {
  React.useEffect(() => {
    // The customer's own tab: stay, and answer for as long as it is open.
    if (!active) return answerAsWatcher(orderId);

    let cancelled = false;
    if (hasLiveOpener()) {
      window.close();
      // Not returning here: if the browser declined, the channel below is
      // still worth asking.
    }
    void anotherTabIsWatching(orderId).then((watching) => {
      if (!cancelled && watching) window.close();
    });
    return () => {
      cancelled = true;
    };
  }, [active, orderId]);

  return null;
}
