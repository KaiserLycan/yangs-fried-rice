import { cn } from "@/lib/utils";
import { formatClockTime } from "@/lib/checkout/order-time";
import type { StageState, TimelineStage } from "@/lib/orders/order-stage";

/**
 * The four-stage timeline, drawn the same way at both breakpoints apart from
 * its marker and rule sizes — 22px markers with a 34px rule on mobile
 * (`132:481`), 20px with 30px on desktop (`133:1164`).
 *
 * The slot below each label is the time the stage was reached, from
 * `order_status_log` (#116): "3:12 PM", or "Now · 3:12 PM" for the current
 * stage. Without a time (orders older than the log) it falls back to the
 * words the frames draw — "Done", "Now" or an em dash.
 */

const STATE_LABELS: Record<StageState, string> = {
  done: "Done",
  now: "Now",
  pending: "—",
};

function StageMarker({ state }: { state: StageState }) {
  const reached = state !== "pending";
  return (
    <div
      aria-hidden
      className={cn(
        "shrink-0 rounded-pill border-2",
        "size-[22px] md:size-[20px]",
        reached
          ? "border-primary bg-primary"
          : "border-timeline-pending bg-background",
      )}
    />
  );
}

function stageMeta(stage: TimelineStage): string {
  if (!stage.reachedAt) return STATE_LABELS[stage.state];
  const time = formatClockTime(new Date(stage.reachedAt));
  return stage.state === "now" ? `Now · ${time}` : time;
}

export function OrderTimeline({ stages }: { stages: TimelineStage[] }) {
  return (
    <ol className="flex w-full flex-col">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        return (
          <li key={stage.stage} className="flex w-full items-start gap-[14px]">
            <div className="flex flex-col items-center">
              <StageMarker state={stage.state} />
              {/* The rule is what joins one marker to the next, so the last
                  stage does not draw one — otherwise the timeline trails off
                  below its own final dot. */}
              {isLast ? null : (
                <div className="h-[34px] w-[2px] bg-rule md:h-[30px]" />
              )}
            </div>

            <div className="flex flex-col items-start pb-[12px] md:pb-[10px]">
              <span
                className={cn(
                  "text-[14px] font-bold",
                  stage.state === "pending"
                    ? "text-placeholder"
                    : "text-foreground",
                )}
              >
                {stage.label}
              </span>
              <span className="text-[12px] text-timeline-meta">
                {stageMeta(stage)}
                {/* The em dash carries no meaning to a screen reader, and
                    "Done"/"Now" alone do not say what they refer to. */}
                <span className="sr-only"> — {stage.label}</span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
