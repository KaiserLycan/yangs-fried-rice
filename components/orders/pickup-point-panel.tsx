import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { PICKUP_COUNTER, SITE_BRANCH, SITE_NAME } from "@/lib/site/site-info";

/**
 * Where to collect the order — in the spot the delivery map used to fill.
 *
 * The shop is pickup-only (issue #114), so the map only ever drew "MAP NOT
 * AVAILABLE": a pickup order has no destination to route to. What a pickup
 * customer actually needs is the counter to go to and what to say there,
 * which is what pickup-ordering guides recommend showing (limitations #10).
 */
export function PickupPointPanel({
  orderNumber,
  className,
}: {
  orderNumber: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="pickup-point-heading"
      className={cn(
        "flex flex-col gap-[10px] border-b border-rule bg-card p-[20px]",
        "md:rounded-lg md:border md:p-[24px]",
        className,
      )}
    >
      <div className="flex items-center gap-[8px] text-primary">
        <MapPin aria-hidden="true" className="size-[20px]" />
        <h2 id="pickup-point-heading" className="font-display text-2xl text-foreground">
          Pick up at {PICKUP_COUNTER}
        </h2>
      </div>
      <p className="text-base leading-[22px] text-muted-strong">
        {SITE_NAME}, {SITE_BRANCH}. When it&apos;s ready, go to {PICKUP_COUNTER} and
        say your order number:
      </p>
      <p className="font-display text-3xl leading-none text-foreground">
        #{orderNumber}
      </p>
      <p className="text-sm text-muted-strong">
        Sending a courier? Give them this number.
      </p>
    </section>
  );
}
