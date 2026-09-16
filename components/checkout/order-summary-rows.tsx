import { formatPeso } from "@/lib/menu/product-listing";
import {
  lineTotal,
  type CartLine,
  type CartTotals,
  type Fulfilment,
} from "@/lib/menu/cart-totals";

/**
 * The rows of the order summary (`133:1124` desktop, `132:424` mobile), and
 * nothing else — no heading, no arrival estimate, no button.
 *
 * Split out of `OrderSummaryCard` so the confirmation screen can show the
 * same summary without inheriting checkout's "Place order" button, which
 * would be meaningless once the order is placed. The alternative was a second
 * summary written from scratch, and two screens adding up the same order
 * separately is how they end up disagreeing about what a customer owes.
 *
 * `totals` arrives already computed by `computeCartTotals`. Nothing in here
 * does arithmetic beyond `lineTotal`.
 */
export function OrderSummaryRows({
  customerName,
  placedAtLabel,
  address,
  fulfilment,
  lines,
  totals,
}: {
  customerName: string;
  placedAtLabel: string;
  address: string | null;
  fulfilment: Fulfilment;
  lines: CartLine[];
  totals: CartTotals;
}) {
  return (
    <>
      <SummaryRow label={customerName || "Your order"} value={placedAtLabel} />
      {/* The address in full, not the nav bar's shortened form. This is the
          only place a mobile customer sees where the order is going — there
          is no delivery details card at that width — and a summary that
          truncates the destination to "Blk 12 Lot 4…" cannot be checked
          against, which is the whole point of Browsing9. */}
      <SummaryRow
        label={
          fulfilment === "delivery"
            ? (address ?? "No saved address")
            : "Collect in store"
        }
        value={fulfilment === "delivery" ? "Delivery" : "Pickup"}
      />

      {lines.map((line) => (
        <SummaryRow
          key={line.id}
          label={`${line.quantity}× ${line.name}`}
          value={formatPeso(lineTotal(line))}
        />
      ))}

      {/* No delivery fee row on a pickup order. `computeCartTotals` correctly
          zeroes the fee, but printing "Delivery fee ₱0" on an order nobody is
          delivering is a line the frame's own reasoning excludes: if it isn't
          part of what this customer owes, it isn't part of the summary. */}
      {fulfilment === "delivery" ? (
        <SummaryRow label="Delivery fee" value={formatPeso(totals.deliveryFee)} />
      ) : null}
      <SummaryRow label="Amount payable" value={formatPeso(totals.total)} />
    </>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-[12px]">
      <span className="text-[13px] text-muted-strong">{label}</span>
      <span className="text-right text-[13px] font-bold text-foreground">
        {value}
      </span>
    </div>
  );
}
