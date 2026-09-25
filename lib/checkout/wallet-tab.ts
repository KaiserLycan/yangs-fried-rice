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

/**
 * Marks the `return_url` a wallet tab comes back to, so the receipt that
 * loads there knows it is the throwaway tab rather than the customer's own.
 *
 * Only added when a tab was actually opened. It is never the sole reason a
 * tab closes: something must also confirm that the customer has another tab
 * to be returned to.
 */
export const WALLET_TAB_PARAM = "wallet_tab";

/**
 * Whether this document still has the tab that opened it.
 *
 * This is the cheap check, not a reliable one. A payment provider that sends
 * `Cross-Origin-Opener-Policy: same-origin` severs the opener permanently,
 * so a tab that goes out to PayMongo and comes back can find
 * `window.opener` null even though it really was script-opened. Hence the
 * channel below.
 */
export function hasLiveOpener(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.opener) && !window.opener.closed;
  } catch {
    // A cross-origin opener throws on `.closed`. Not ours, so not ours to
    // return to either.
    return false;
  }
}

/**
 * How the two tabs find each other when the opener link is gone.
 *
 * The question that actually decides whether this tab may close is not "was
 * I opened by a script" but "is another tab already watching this order" —
 * and that one can be asked directly. The receipt the customer kept open
 * answers; PayMongo's headers cannot interfere, because both tabs are on
 * our own origin by the time it is asked.
 *
 * This also keeps the same-tab fallback safe without any special case: when
 * the popup was blocked there is only ever one tab, nobody answers, and
 * nothing closes.
 */
const CHANNEL = "yfr-wallet-payment";

type Signal =
  /** "Is anyone else watching this order?" — from the tab hoping to close. */
  | { kind: "who-is-watching"; orderId: string }
  /** "I am." — from the customer's own tab. */
  | { kind: "watching"; orderId: string };

function openChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  try {
    return new BroadcastChannel(CHANNEL);
  } catch {
    return null;
  }
}

/**
 * Answer, for as long as this tab is open, that it is watching `orderId`.
 * Returns the teardown.
 */
export function answerAsWatcher(orderId: string): () => void {
  const channel = openChannel();
  if (!channel) return () => {};

  channel.onmessage = (event: MessageEvent<Signal>) => {
    if (
      event.data?.kind === "who-is-watching" &&
      event.data.orderId === orderId
    ) {
      channel.postMessage({ kind: "watching", orderId } satisfies Signal);
    }
  };

  return () => channel.close();
}

/**
 * Ask whether another tab is watching `orderId`, and resolve true if one
 * says so within `timeoutMs`.
 *
 * Resolves false on silence rather than waiting, because silence is the
 * answer that means "do not close" — the cautious direction.
 */
export function anotherTabIsWatching(
  orderId: string,
  timeoutMs = 600,
): Promise<boolean> {
  const channel = openChannel();
  if (!channel) return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (answer: boolean) => {
      if (settled) return;
      settled = true;
      channel.close();
      resolve(answer);
    };

    channel.onmessage = (event: MessageEvent<Signal>) => {
      if (event.data?.kind === "watching" && event.data.orderId === orderId) {
        finish(true);
      }
    };
    channel.postMessage({ kind: "who-is-watching", orderId } satisfies Signal);
    window.setTimeout(() => finish(false), timeoutMs);
  });
}

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
