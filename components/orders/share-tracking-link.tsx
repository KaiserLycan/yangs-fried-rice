"use client";

import * as React from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The order's tracking link (FINALE "More things"): follow the order from
 * any phone without signing in, or send it to whoever is collecting.
 */
export function ShareTrackingLink({ orderId, token }: { orderId: string; token: string }) {
  const [copied, setCopied] = React.useState(false);
  const [href, setHref] = React.useState(`/track/${orderId}?t=${token}`);

  React.useEffect(() => {
    setHref(`${window.location.origin}/track/${orderId}?t=${token}`);
  }, [orderId, token]);

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link is on screen to copy by hand.
    }
  }

  return (
    <section className="flex w-full flex-col gap-2 rounded-lg border border-rule bg-card p-4">
      <h2 className="text-sm font-bold uppercase tracking-[1.44px] text-muted-foreground">Track without signing in</h2>
      <p className="text-sm text-muted-strong">
        Open this link on any phone, or send it to whoever is picking up. It shows the order&apos;s status and items only.
      </p>
      <p className="break-all rounded-md bg-background px-3 py-2 font-mono text-sm text-foreground">{href}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="w-auto gap-2 px-4" onClick={copy}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        {canShare && (
          <Button
            variant="outline"
            className="w-auto gap-2 px-4"
            onClick={() => navigator.share({ title: "Track my Yang's order", url: href }).catch(() => undefined)}
          >
            <Share2 className="size-4" aria-hidden />
            Share
          </Button>
        )}
      </div>
    </section>
  );
}
