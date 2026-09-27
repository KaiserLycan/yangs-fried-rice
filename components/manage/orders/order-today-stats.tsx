"use client";

import * as React from "react";
import { QuickStats } from "@/components/manage/quick-stats";
import { getTodayOrderStats, type TodayOrderStats } from "@/lib/actions/orders";
import { formatPeso } from "@/lib/menu/product-listing";

/** Today's orders at a glance, refreshed with the page and every 30 seconds. */
export function OrderTodayStats({ refreshKey = 0 }: { refreshKey?: number }) {
  const [stats, setStats] = React.useState<TodayOrderStats | null>(null);

  React.useEffect(() => {
    let active = true;
    const load = () =>
      getTodayOrderStats().then((result) => {
        if (active && result.data) setStats(result.data);
      });
    void load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshKey]);

  const s = stats;
  return (
    <QuickStats
      label="Today's orders"
      isLoading={!s}
      stats={[
        { label: "Placed today", value: s?.placed ?? 0, hint: s ? `${s.active} in progress` : undefined },
        { label: "Picked up", value: s?.completed ?? 0, tone: "good" },
        { label: "Cancelled", value: s?.cancelled ?? 0, tone: s && s.cancelled > 0 ? "bad" : "default", hint: s?.noShows ? `${s.noShows} not picked up` : undefined },
        { label: "Payment issues", value: s?.paymentIssues ?? 0, tone: s && s.paymentIssues > 0 ? "warn" : "default" },
        { label: "Avg to ready", value: s?.avgMinutesToReady != null ? `${s.avgMinutesToReady} min` : "—" },
        { label: "Sales today", value: formatPeso(s?.sales ?? 0), hint: "picked-up orders" },
      ]}
    />
  );
}
