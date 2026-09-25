"use client";

/**
 * The tab a wallet payment happens in.
 *
 * Checkout used to hand the whole browser over to PayMongo with
 * `location.assign`. That works right up until the wallet's page does not
 * send the customer back: PayMongo answers an expired or already-consumed
 * source with a bare "Source ... has expired status" page that has no link
 * out, and whose redirect chain swallows the browser's Back button. The
 * customer is then holding an order they cannot see, cannot pay for and
 * cannot switch to cash on delivery (issue #106).
 *
 * Opening the wallet beside us instead of on top of us removes the problem
 * rather than papering over it: our own tab stays on the receipt, watching
 * the payment settle and offering both ways out the whole time, so a dead
 * end over there costs the customer one tab switch.
 *
 * The opening has to happen **synchronously inside the click**, before
 * `submitCart` is awaited, or the browser treats it as an unrequested popup
 * and blocks it. So the tab is opened empty and pointed at the wallet once
 * there is somewhere to point it.
 */

/** What the empty tab shows for the moment before the wallet's page loads. */
const PLACEHOLDER = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Opening your wallet…</title></head>
<body style="margin:0;display:grid;place-items:center;height:100vh;font:16px/1.5 system-ui,sans-serif;color:#3a2e2c;background:#fdf8f0">
Opening your wallet…</body></html>`;

export interface WalletTab {
  /** Sends the tab to the wallet. False when it is gone — blocked, or closed. */
  send(url: string): boolean;
  /** Closes it, for an order that never reached the wallet at all. */
  close(): void;
}

/**
 * Call this **first thing** in the click handler, before any `await`.
 *
 * Returns null when the browser refused — popup blockers are common enough
 * that callers must handle it, and the honest fallback is the old same-tab
 * hand-off rather than an order with no way to pay for it.
 */
export function openWalletTab(): WalletTab | null {
  const tab = window.open("", "_blank");
  if (!tab) return null;

  try {
    tab.document.write(PLACEHOLDER);
    tab.document.close();
  } catch {
    // Writing into the new document can throw in a stricter browser. The
    // tab is still usable; it just shows about:blank until `send`.
  }

  return {
    send(url: string) {
      if (tab.closed) return false;
      tab.location.href = url;
      // Focus follows the payment: that tab is where the customer has to
      // act next. `focus` is advisory and some browsers ignore it, which
      // costs nothing — the tab is open either way.
      tab.focus?.();
      return true;
    },
    close() {
      if (!tab.closed) tab.close();
    },
  };
}
