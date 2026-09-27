import { useState, useRef, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Advanced Orders filters. Dates are the calendar days picked ("2026-09-27");
 * the page turns them into the start and end of those days in local time.
 */
export type OrderFilterState = {
  date_from?: string;
  date_to?: string;
  customer_name?: string;
  customer_phone?: string;
  payment_method?: "pay_in_store" | "wallet";
  order_type?: "take_out" | "dine_in";
  /** Order total in pesos (items + add-ons). */
  min_total?: number;
  max_total?: number;
};

function toAmount(value: string): number | undefined {
  const trimmed = value.trim().replace(/,/g, "");
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

interface OrderFilterPopoverProps {
  filters: OrderFilterState;
  onFilterChange: (filters: OrderFilterState) => void;
}

const FIELD_LABEL = "text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]";
const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-[#DDCDB8] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8541F]";

export function OrderFilterPopover({ filters, onFilterChange }: OrderFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<OrderFilterState>(filters);
  const containerRef = useRef<HTMLDivElement>(null);

  // Kept as text so a half-typed amount isn't wiped mid-keystroke.
  const [minTotalText, setMinTotalText] = useState("");
  const [maxTotalText, setMaxTotalText] = useState("");

  // Start every opening from what is actually applied, not a stale draft.
  useEffect(() => {
    if (!open) return;
    setDraft(filters);
    setMinTotalText(filters.min_total?.toString() ?? "");
    setMaxTotalText(filters.max_total?.toString() ?? "");
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

  const rangeInvalid = !!(draft.date_from && draft.date_to && draft.date_to < draft.date_from);
  const minTotal = toAmount(minTotalText);
  const maxTotal = toAmount(maxTotalText);
  const amountUnreadable =
    (minTotalText.trim() !== "" && minTotal === undefined) ||
    (maxTotalText.trim() !== "" && maxTotal === undefined);
  const amountBackwards = minTotal !== undefined && maxTotal !== undefined && maxTotal < minTotal;
  const invalid = rangeInvalid || amountUnreadable || amountBackwards;

  const handleApply = () => {
    if (invalid) return;
    onFilterChange({
      date_from: draft.date_from || undefined,
      date_to: draft.date_to || undefined,
      customer_name: draft.customer_name?.trim() || undefined,
      customer_phone: draft.customer_phone?.trim() || undefined,
      payment_method: draft.payment_method || undefined,
      order_type: draft.order_type || undefined,
      min_total: minTotal,
      max_total: maxTotal,
    });
    setOpen(false);
  };

  const handleClear = () => {
    setMinTotalText("");
    setMaxTotalText("");
    setDraft({});
    onFilterChange({});
    setOpen(false);
  };

  const activeCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="h-[45px] w-full sm:w-auto gap-2 rounded-xl border-[#DDCDB8] text-[#1a1210]"
      >
        <Filter className="h-4 w-4" />
        Filter
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8541F] text-[11px] text-white">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-[min(340px,calc(100vw-32px))] rounded-xl border border-[#DDCDB8] bg-white p-4 shadow-lg z-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-[#1a1210]">Filter orders</h4>
              {activeCount > 0 && (
                <button
                  onClick={handleClear}
                  className="flex items-center text-sm text-[#bf4342] hover:underline"
                >
                  <X className="h-4 w-4 mr-1" /> Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="order-filter-from" className={FIELD_LABEL}>From</label>
                <Input
                  id="order-filter-from"
                  type="date"
                  value={draft.date_from || ""}
                  onChange={(e) => setDraft({ ...draft, date_from: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="order-filter-to" className={FIELD_LABEL}>To</label>
                <Input
                  id="order-filter-to"
                  type="date"
                  value={draft.date_to || ""}
                  min={draft.date_from || undefined}
                  onChange={(e) => setDraft({ ...draft, date_to: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
            {rangeInvalid && (
              <p className="text-[13px] text-red-600">The end date can&apos;t be before the start date.</p>
            )}

            <div className="space-y-1">
              <label htmlFor="order-filter-name" className={FIELD_LABEL}>Customer name</label>
              <Input
                id="order-filter-name"
                value={draft.customer_name || ""}
                onChange={(e) => setDraft({ ...draft, customer_name: e.target.value })}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="order-filter-phone" className={FIELD_LABEL}>Customer phone</label>
              <Input
                id="order-filter-phone"
                inputMode="tel"
                value={draft.customer_phone || ""}
                onChange={(e) => setDraft({ ...draft, customer_phone: e.target.value })}
                placeholder="e.g. 0912 345 6789"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="order-filter-payment" className={FIELD_LABEL}>Payment</label>
                <select
                  id="order-filter-payment"
                  className={SELECT_CLASS}
                  value={draft.payment_method || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      payment_method: (e.target.value || undefined) as OrderFilterState["payment_method"],
                    })
                  }
                >
                  <option value="">Any</option>
                  <option value="pay_in_store">Pay in store</option>
                  <option value="wallet">GCash / e-wallet</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="order-filter-type" className={FIELD_LABEL}>Type</label>
                <select
                  id="order-filter-type"
                  className={SELECT_CLASS}
                  value={draft.order_type || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      order_type: (e.target.value || undefined) as OrderFilterState["order_type"],
                    })
                  }
                >
                  <option value="">Any</option>
                  <option value="take_out">Take out</option>
                  <option value="dine_in">Dine in</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleApply}
              disabled={rangeInvalid}
              variant="primary"
              className="w-full bg-[#CD7D39] hover:bg-orange-600 text-white"
            >
              Apply filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
