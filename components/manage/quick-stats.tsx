import { cn } from "@/lib/utils";

export type QuickStat = {
  label: string;
  value: string | number;
  /** A second line under the number: context, not decoration. */
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
};

const TONE = {
  default: "text-foreground",
  good: "text-success",
  warn: "text-warning-text",
  bad: "text-destructive",
} as const;

/**
 * The at-a-glance row at the top of a back-office page (FINALE "More
 * things": quick statistics on menu and order management). Numbers only —
 * the page below is where they can be acted on.
 */
export function QuickStats({ stats, isLoading = false, label }: { stats: QuickStat[]; isLoading?: boolean; label: string }) {
  return (
    <dl aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-0.5 rounded-md border border-rule bg-card px-3 py-2.5">
          <dt className="text-xs font-bold uppercase tracking-[1px] text-muted-foreground">{stat.label}</dt>
          <dd className={cn("font-display text-2xl leading-tight", TONE[stat.tone ?? "default"])}>
            {isLoading ? <span className="inline-block h-6 w-10 animate-pulse rounded-sm bg-track align-middle" /> : stat.value}
          </dd>
          {stat.hint && <dd className="text-xs text-muted-foreground">{stat.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
