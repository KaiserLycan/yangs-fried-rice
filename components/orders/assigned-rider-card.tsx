import { Avatar } from "@/components/ui/avatar";
import { initialsFrom } from "@/lib/profile/identity";
import type { AssignedRider } from "@/lib/orders/read-tracked-order";
import { cn } from "@/lib/utils";

/**
 * Who is bringing the order (ticket 16). No frame draws this, so it borrows
 * the timeline card's surface — same border, radius and 20px padding — and
 * sits directly under it. Photo when the employee has one, initials
 * otherwise, the same `Avatar` the nav bar uses for the customer.
 *
 * The empty state is a card too, not nothing: the screen should not jump
 * when the rider appears, and "not assigned yet" tells the customer the
 * blank is expected rather than broken. When the card should not exist at
 * all — a take-out order, a cancelled one — the screen leaves it out.
 */
export function AssignedRiderCard({
  rider,
  className,
}: {
  rider: AssignedRider | null;
  className?: string;
}) {
  const vehicleLine = rider
    ? [rider.vehicle, rider.plate].filter(Boolean).join(" · ")
    : "";

  return (
    <section
      aria-label="Your rider"
      className={cn(
        "flex flex-col gap-[12px] p-[20px]",
        "md:rounded-lg md:border md:border-rule md:bg-white",
        className,
      )}
    >
      <h2 className="text-[11px] uppercase tracking-[1.76px] text-muted-foreground md:text-[12px] md:tracking-[1.92px]">
        Your rider
      </h2>

      {rider ? (
        <div className="flex items-center gap-[14px]">
          <Avatar
            initials={initialsFrom(rider.name)}
            imageUrl={rider.photoUrl}
            className="size-[48px] text-[16px] font-bold text-white"
          />
          <div className="flex min-w-0 flex-col gap-[2px]">
            <p className="truncate text-[15px] font-bold text-foreground">
              {rider.name}
            </p>
            {vehicleLine && (
              <p className="text-[13px] text-muted-strong">{vehicleLine}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[2px]">
          <p className="text-[15px] font-bold text-foreground">
            Rider not assigned yet
          </p>
          <p className="text-[13px] text-muted-strong">
            You&apos;ll see who is bringing your order once a rider accepts it.
          </p>
        </div>
      )}
    </section>
  );
}
