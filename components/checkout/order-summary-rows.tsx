import { formatPeso, formatPesoCentavos } from "@/lib/menu/product-listing";
import type { LineFlags } from "@/lib/checkout/cart-recheck";
import {
  lineTotal,
  vatBreakdown,
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
export type OrderSummaryDiscount = {
  type: "senior_citizen" | "pwd";
  vatExemptSales: number;
  discount: number;
  total: number;
};

/** A promo code on the order: the code and the pesos it took off. */
export type OrderSummaryPromo = {
  code: string;
  discount: number;
};

export function OrderSummaryRows({
  customerName,
  placedAtLabel,
  fulfilment,
  lines,
  totals,
  discount,
  promo,
  flags = {},
}: {
  customerName: string;
  placedAtLabel: string;
  fulfilment: Fulfilment;
  lines: CartLine[];
  totals: CartTotals;
  discount?: OrderSummaryDiscount | null;
  /** Ignored when `discount` is set: an order has one discount or the other. */
  promo?: OrderSummaryPromo | null;
  /** Lines checkout found sold out or re-priced (FINALE 9.1, 9.10). */
  flags?: LineFlags;
}) {
  return (
    <>
      <SummaryRow label={customerName || "Your order"} value={placedAtLabel} />
      {/* Pickup-only (#114): there is no address to show. A legacy delivery
          order from before the switch still says what it was. */}
      <SummaryRow
        label={fulfilment === "delivery" ? "Delivered order" : "Collect in store"}
        value={fulfilment === "delivery" ? "Delivery" : "Pickup"}
      />

      {lines.map((line) => {
        const flag = flags[line.id];
        return (
        <div
          key={line.id}
          data-flag={flag?.kind}
          className={
            flag
              ? "-mx-[8px] flex flex-col gap-1 rounded-md bg-warning-surface px-[8px] py-[6px]"
              : "flex flex-col gap-1"
          }
        >
          <SummaryRow
            label={`${line.quantity}× ${line.name}`}
            value={formatPeso(lineTotal(line))}
          />
          {flag?.kind === "unavailable" ? (
            <p className="text-sm font-bold text-warning-text">
              Sold out — remove it to place your order
            </p>
          ) : flag?.kind === "price" ? (
            <p className="text-sm font-bold text-warning-text">
              Now {formatSummaryMoney(flag.now)} each (was {formatSummaryMoney(flag.was)})
            </p>
          ) : null}
          {line.addOns && line.addOns.length > 0 && (
            <ul className="flex flex-col gap-0.5 -mt-1 pl-4 text-sm text-muted-foreground">
              {line.addOns.map((addon) => (
                <li key={addon.addon_id}>+ {addon.name}</li>
              ))}
            </ul>
          )}
        </div>
        );
      })}

      {/* No delivery fee row on a pickup order. `computeCartTotals` correctly
          zeroes the fee, but printing "Delivery fee ₱0" on an order nobody is
          delivering is a line the frame's own reasoning excludes: if it isn't
          part of what this customer owes, it isn't part of the summary. */}
      {fulfilment === "delivery" ? (
        <SummaryRow label="Delivery fee" value={formatPeso(totals.deliveryFee)} />
      ) : null}
      {/* When a Senior / PWD discount applies: VAT exempt ₱0, discount, and net total.
          Otherwise: standard VATable sales + 12% VAT split (#116). */}
      {discount ? (
        <>
          <SummaryRow label="VAT exempt" value={formatSummaryMoney(0)} />
          <SummaryRow label="Discount" value={formatSummaryMoney(discount.discount)} />
          <SummaryRow label="Total" value={formatSummaryMoney(discount.total)} />
        </>
      ) : promo ? (
        <PromoRows promo={promo} total={totals.total} />
      ) : (
        <>
          <SummaryRow label="VATable sales" value={formatPesoCentavos(totals.vatableSales)} />
          <SummaryRow label="VAT (12%)" value={formatPesoCentavos(totals.vat)} />
          <SummaryRow label="Total" value={formatPesoCentavos(totals.total)} />
        </>
      )}
    </>
  );
}

/**
 * Promo code: the discount comes off the VAT-inclusive total, and the VAT
 * split is of what is actually paid — as `submit_cart_to_order` saves it.
 */
function PromoRows({ promo, total }: { promo: OrderSummaryPromo; total: number }) {
  const due = Math.max(0, Math.round((total - promo.discount) * 100) / 100);
  const { vatableSales, vat } = vatBreakdown(due);
  return (
    <>
      <SummaryRow label="Subtotal" value={formatPesoCentavos(total)} />
      <SummaryRow label={`Promo (${promo.code})`} value={`−${formatSummaryMoney(promo.discount)}`} />
      <SummaryRow label="VATable sales" value={formatPesoCentavos(vatableSales)} />
      <SummaryRow label="VAT (12%)" value={formatPesoCentavos(vat)} />
      <SummaryRow label="Total" value={formatPesoCentavos(due)} />
    </>
  );
}

function formatSummaryMoney(amount: number): string {
  return Number.isInteger(amount) ? formatPeso(amount) : formatPesoCentavos(amount);
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
      <span className="text-sm text-muted-strong">{label}</span>
      <span className="text-right text-sm font-bold text-foreground">
        {value}
      </span>
    </div>
  );
}
