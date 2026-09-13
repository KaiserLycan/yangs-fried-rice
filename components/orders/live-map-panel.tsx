import { cn } from "@/lib/utils";

/**
 * The map panel — a placeholder, deliberately.
 *
 * It is an empty rectangle in the design too, and ticket 06 says in as many
 * words: render a placeholder, do not integrate a mapping service. The faint
 * grid is drawn with two repeating linear gradients, which is how the frames
 * draw it and avoids shipping an image for a few hairlines.
 *
 * One panel, two treatments. Mobile (`132:481`) is a full-bleed band
 * captioned "LIVE MAP"; desktop (`133:1164`) is a rounded card carrying an
 * ink chip that names the rider. Only the captions are swapped by breakpoint
 * — the surface, the grid and the element itself are shared, so the screen
 * keeps one DOM tree rather than rendering itself twice.
 */

const GRID = [
  "repeating-linear-gradient(0deg, hsl(var(--map-grid)) 0 1px, transparent 1px 28px)",
  "repeating-linear-gradient(90deg, hsl(var(--map-grid)) 0 1px, transparent 1px 28px)",
].join(", ");

export function LiveMapPanel({
  riderName,
  className,
}: {
  riderName: string | null;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={
        riderName
          ? `Live map placeholder. ${riderName} is delivering this order.`
          : "Live map placeholder. No rider has been assigned yet."
      }
      className={cn(
        "relative overflow-clip bg-map-surface",
        "h-[168px] border-b border-map-border",
        "md:h-full md:min-h-[470px] md:rounded-lg md:border md:border-rule",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: GRID }}
      />

      <div className="relative flex h-full items-center justify-center md:hidden">
        <span className="text-[11px] font-bold tracking-[1.32px] text-map-label">
          LIVE MAP
        </span>
      </div>

      {/* The frame captions this "Rider Ariel S. · 2.4 km away". The name is
          real — it comes from the delivery's rider — but no distance is
          stored anywhere, so that half is left out rather than invented. See
          the handoff doc. */}
      <div className="absolute bottom-[20px] left-[22px] hidden rounded-md bg-foreground px-[16px] py-[12px] md:block">
        <p className="text-[13px] leading-[19.5px] text-on-ink">
          {riderName ? `Rider ${riderName}` : "No rider assigned yet"}
        </p>
        <p className="text-[13px] leading-[19.5px] text-on-ink-muted">
          Live map · mapping service integration
        </p>
      </div>
    </div>
  );
}
