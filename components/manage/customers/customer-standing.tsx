"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCustomerStanding, toggleCustomerDisabled } from "@/lib/actions/admin";
import { NO_SHOW_CASH_BLOCK, NO_SHOW_DISABLE_PROMPT } from "@/lib/checkout/order-rules";

type Standing = { noShows: number; cashNoShows: number; isDisabled: boolean };

/**
 * Missed pick-ups and account status in the customer modal (panel feedback
 * F14). At NO_SHOW_DISABLE_PROMPT the manager is asked, not forced, to
 * disable the account — a disabled customer sees why when they try to sign
 * in (lib/auth/account-status.ts).
 */
export function CustomerStanding({ customerId }: { customerId: string }) {
  const [standing, setStanding] = React.useState<Standing | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setStanding(null);
    getCustomerStanding(customerId).then((result) => {
      if (!active) return;
      if (result.error) setError(result.error);
      else setStanding(result.data);
    });
    return () => {
      active = false;
    };
  }, [customerId]);

  async function setDisabled(disabled: boolean) {
    setPending(true);
    const result = await toggleCustomerDisabled(customerId, disabled);
    setPending(false);
    if (result.error) setError(result.error);
    else setStanding((current) => (current ? { ...current, isDisabled: disabled } : current));
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!standing) return <div className="h-[60px] w-full animate-pulse rounded-md bg-track" />;

  const shouldPrompt = standing.noShows >= NO_SHOW_DISABLE_PROMPT && !standing.isDisabled;

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border border-field-border bg-white p-[14px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">Account standing</span>
          <span className="text-base text-foreground">
            {standing.isDisabled ? "Disabled" : "Active"} · {standing.noShows} missed pick-up{standing.noShows === 1 ? "" : "s"}
          </span>
          {standing.cashNoShows >= NO_SHOW_CASH_BLOCK && (
            <span className="text-sm text-warning-text">Pay in store is off for this account.</span>
          )}
        </div>
        <Button
          variant={standing.isDisabled ? "outline" : "confirm"}
          className="w-auto px-4"
          disabled={pending}
          onClick={() => setDisabled(!standing.isDisabled)}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : standing.isDisabled ? "Enable account" : "Disable account"}
        </Button>
      </div>
      {shouldPrompt && (
        <p role="note" className="flex items-start gap-2 rounded-md bg-warning-surface p-3 text-sm text-warning-text">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {standing.noShows} orders were never picked up. Consider disabling this account.
        </p>
      )}
    </div>
  );
}
