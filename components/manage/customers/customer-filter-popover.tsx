"use client";

import { useEffect, useRef, useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  activeCustomerFilterCount,
  type CustomerActivity,
  type CustomerFilters,
} from "@/lib/validation/customer-filters";

interface CustomerFilterPopoverProps {
  filters: CustomerFilters;
  onFilterChange: (filters: CustomerFilters) => void;
}

const FIELD_LABEL = "text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground";
const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-field-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

/** "2026-09-01" in the browser's time zone (the store's, for its staff). */
function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** One-click periods for the questions managers actually ask ("top customers this month"). */
function periodPresets(): { label: string; from?: string; to?: string }[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    { label: "This month", from: isoDay(new Date(y, m, 1)), to: isoDay(now) },
    { label: "Last month", from: isoDay(new Date(y, m - 1, 1)), to: isoDay(new Date(y, m, 0)) },
    { label: "Last 30 days", from: isoDay(new Date(y, m, now.getDate() - 29)), to: isoDay(now) },
    { label: "This year", from: isoDay(new Date(y, 0, 1)), to: isoDay(now) },
    { label: "All time" },
  ];
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function CustomerFilterPopover({ filters, onFilterChange }: CustomerFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CustomerFilters>(filters);
  // Kept as text so a half-typed number isn't wiped mid-keystroke.
  const [minOrdersText, setMinOrdersText] = useState("");
  const [minSpentText, setMinSpentText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Every opening starts from what is applied, not an abandoned draft.
  useEffect(() => {
    if (!open) return;
    setDraft(filters);
    setMinOrdersText(filters.minOrders?.toString() ?? "");
    setMinSpentText(filters.minSpent?.toString() ?? "");
  }, [open, filters]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const periodInvalid = !!(draft.from && draft.to && draft.to < draft.from);
  const joinedInvalid = !!(draft.joinedFrom && draft.joinedTo && draft.joinedTo < draft.joinedFrom);
  const numbersInvalid =
    (minOrdersText.trim() !== "" && toNumber(minOrdersText) === undefined) ||
    (minSpentText.trim() !== "" && toNumber(minSpentText) === undefined);
  const invalid = periodInvalid || joinedInvalid || numbersInvalid;
  const hasPeriod = !!(draft.from || draft.to);

  const handleApply = () => {
    if (invalid) return;
    const minOrders = toNumber(minOrdersText);
    onFilterChange({
      from: draft.from || undefined,
      to: draft.to || undefined,
      minOrders: minOrders === undefined ? undefined : Math.floor(minOrders),
      minSpent: toNumber(minSpentText),
      joinedFrom: draft.joinedFrom || undefined,
      joinedTo: draft.joinedTo || undefined,
      activity: draft.activity && draft.activity !== "any" ? draft.activity : undefined,
    });
    setOpen(false);
  };

  const handleClear = () => {
    setDraft({});
    setMinOrdersText("");
    setMinSpentText("");
    onFilterChange({});
    setOpen(false);
  };

  const activeCount = activeCustomerFilterCount(filters);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="h-[45px] w-full md:w-auto gap-2 rounded-md border-field-border text-foreground"
      >
        <Filter className="h-4 w-4" />
        Filter
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-[min(380px,calc(100vw-32px))] max-h-[75vh] overflow-y-auto rounded-md border border-field-border bg-white p-4 shadow-lg z-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Filter customers</h4>
              {activeCount > 0 && (
                <Button variant="unstyled" onClick={handleClear} className="flex items-center text-sm text-destructive hover:underline">
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>

            {/* Period — changes what Orders and Spent count */}
            <fieldset className="space-y-2">
              <legend className={FIELD_LABEL}>Orders &amp; spending period</legend>
              <div className="flex flex-wrap gap-1.5">
                {periodPresets().map((preset) => {
                  const selected = (draft.from ?? undefined) === preset.from && (draft.to ?? undefined) === preset.to;
                  return (
                    <Button variant="unstyled"
                      key={preset.label}
                      type="button"
                      onClick={() => setDraft({ ...draft, from: preset.from, to: preset.to })}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                        selected
                          ? "border-accent bg-warning-surface text-backoffice"
                          : "border-field-border text-muted-strong hover:bg-background",
                      )}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="cust-filter-from" className="text-xs text-muted-foreground">From</label>
                  <Input
                    id="cust-filter-from"
                    type="date"
                    value={draft.from ?? ""}
                    onChange={(e) => setDraft({ ...draft, from: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="cust-filter-to" className="text-xs text-muted-foreground">To</label>
                  <Input
                    id="cust-filter-to"
                    type="date"
                    value={draft.to ?? ""}
                    min={draft.from || undefined}
                    onChange={(e) => setDraft({ ...draft, to: e.target.value || undefined })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {hasPeriod
                  ? "Orders and Spent count only completed orders in this period."
                  : "No period: Orders and Spent are lifetime totals."}
              </p>
              {periodInvalid && (
                <p className="text-sm text-destructive">The period can&apos;t end before it starts.</p>
              )}
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="cust-filter-min-orders" className={FIELD_LABEL}>Min. orders</label>
                <Input
                  id="cust-filter-min-orders"
                  inputMode="numeric"
                  placeholder="e.g. 5"
                  value={minOrdersText}
                  onChange={(e) => setMinOrdersText(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="cust-filter-min-spent" className={FIELD_LABEL}>Min. spent (₱)</label>
                <Input
                  id="cust-filter-min-spent"
                  inputMode="decimal"
                  placeholder="e.g. 2000"
                  value={minSpentText}
                  onChange={(e) => setMinSpentText(e.target.value)}
                />
              </div>
            </div>
            {numbersInvalid && (
              <p className="text-sm text-destructive">Minimums must be numbers of 0 or more.</p>
            )}

            <div className="space-y-1">
              <label htmlFor="cust-filter-activity" className={FIELD_LABEL}>Activity</label>
              <select
                id="cust-filter-activity"
                className={SELECT_CLASS}
                value={draft.activity ?? "any"}
                onChange={(e) => setDraft({ ...draft, activity: e.target.value as CustomerActivity })}
              >
                <option value="any">Any</option>
                <option value="ordered">{hasPeriod ? "Ordered in this period" : "Has ordered"}</option>
                <option value="not_ordered">{hasPeriod ? "No orders in this period" : "Never ordered"}</option>
              </select>
            </div>

            <fieldset className="space-y-1">
              <legend className={FIELD_LABEL}>Joined</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="cust-filter-joined-from" className="text-xs text-muted-foreground">From</label>
                  <Input
                    id="cust-filter-joined-from"
                    type="date"
                    value={draft.joinedFrom ?? ""}
                    onChange={(e) => setDraft({ ...draft, joinedFrom: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="cust-filter-joined-to" className="text-xs text-muted-foreground">To</label>
                  <Input
                    id="cust-filter-joined-to"
                    type="date"
                    value={draft.joinedTo ?? ""}
                    min={draft.joinedFrom || undefined}
                    onChange={(e) => setDraft({ ...draft, joinedTo: e.target.value || undefined })}
                  />
                </div>
              </div>
              {joinedInvalid && (
                <p className="text-sm text-destructive">The joined range can&apos;t end before it starts.</p>
              )}
            </fieldset>

            <Button
              onClick={handleApply}
              disabled={invalid}
              variant="primary"
              className="w-full bg-status-preparing hover:bg-accent/90 text-white"
            >
              Apply filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
