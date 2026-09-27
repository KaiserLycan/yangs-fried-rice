"use client";

import * as React from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { getOpenOrderIssues, resolveOrderIssue, type OpenOrderIssue } from "@/lib/actions/order-issues";
import { formatPlacedAt } from "@/lib/orders/past-order";
import { ORDER_ISSUE_LABELS } from "@/lib/validation/order-issue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Open "Report a problem" submissions (limitations #24), above the order
 * grid. Hidden entirely when there are none, so a quiet day costs no space.
 *
 * Resolving only records that someone dealt with it — refunds and remakes
 * are still handled at the counter (see `lacking.md`).
 */
export function OpenIssuesPanel() {
  const showToast = useToast();
  const [issues, setIssues] = React.useState<OpenOrderIssue[] | null>(null);
  const [expanded, setExpanded] = React.useState(true);
  const [resolving, setResolving] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const result = await getOpenOrderIssues();
    if (result.error !== null) {
      showToast(`Couldn't load problem reports: ${result.error}`, "error");
      return;
    }
    setIssues(result.data);
  }, [showToast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function resolve(issue: OpenOrderIssue) {
    setResolving(issue.issueId);
    const result = await resolveOrderIssue(issue.issueId);
    setResolving(null);
    if (result.error !== null) {
      showToast(result.error, "error");
      void load();
      return;
    }
    showToast(`Report on order #${issue.orderNumber} marked resolved.`, "success");
    setIssues((previous) => (previous ?? []).filter((row) => row.issueId !== issue.issueId));
  }

  if (!issues || issues.length === 0) return null;

  return (
    <section
      aria-labelledby="open-issues-heading"
      className="mb-4 rounded-md border border-warning bg-warning-surface"
    >
      <Button variant="unstyled"
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls="open-issues-list"
        className="flex min-h-[48px] w-full items-center gap-3 px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <AlertTriangle aria-hidden="true" className="size-5 shrink-0 text-warning-text" />
        <h2 id="open-issues-heading" className="flex-1 text-base font-bold text-foreground">
          {issues.length} open problem {issues.length === 1 ? "report" : "reports"}
        </h2>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-5 text-muted-foreground transition-transform", expanded && "rotate-180")}
        />
      </Button>

      {expanded ? (
        <ul id="open-issues-list" className="flex flex-col divide-y divide-selected border-t border-selected">
          {issues.map((issue) => (
            <li key={issue.issueId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              {issue.photoUrl ? (
                <a
                  href={issue.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a signed URL that expires in minutes; next/image would cache it */}
                  <img
                    src={issue.photoUrl}
                    alt={`Photo from the customer for order #${issue.orderNumber}`}
                    className="size-[88px] rounded-lg object-cover"
                  />
                </a>
              ) : null}

              <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-foreground">
                <p className="font-bold">
                  #{issue.orderNumber} · {ORDER_ISSUE_LABELS[issue.issueType]}
                  <span className="font-normal text-muted-strong"> · {formatPlacedAt(issue.createdAt)}</span>
                </p>
                <p>
                  {issue.items.length > 0
                    ? issue.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")
                    : "Items no longer on record"}
                </p>
                {issue.note ? <p className="italic text-muted-strong">&ldquo;{issue.note}&rdquo;</p> : null}
                <p className="text-muted-strong">
                  {issue.customerName}
                  {issue.customerPhone ? ` · ${issue.customerPhone}` : ""}
                </p>
              </div>

              <Button variant="unstyled"
                type="button"
                onClick={() => void resolve(issue)}
                disabled={resolving === issue.issueId}
                className="min-h-[44px] shrink-0 rounded-lg bg-foreground px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {resolving === issue.issueId ? "Resolving…" : "Mark resolved"}
                <span className="sr-only"> — order #{issue.orderNumber}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
